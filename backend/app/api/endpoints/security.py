from fastapi import APIRouter, Request, HTTPException
import hashlib
import aiohttp
import json
import os
import re
import time

router = APIRouter(prefix="/api/security", tags=["security"])

# ── ThreatFox cache — prevents frontend polling from hammering the upstream ──
# Stores (timestamp, data). TTL: 60 seconds.
_threatfox_cache: dict = {"ts": 0, "data": None}
THREATFOX_TTL = 60  # seconds


@router.get("/threatfox/latest")
async def get_latest_threatfox(limit: int = 10):
    """
    Fetches latest IOCs from ThreatFox (abuse.ch).
    - ThreatFox requires POST with JSON body (not GET with params).
    - Results are cached for 60s to prevent upstream spam from frontend polling.
    - Returns safe empty fallback on upstream failure instead of 502.
    """
    safe_limit = max(1, min(limit, 50))

    # Return cached result if fresh
    now = time.time()
    if _threatfox_cache["data"] is not None and (now - _threatfox_cache["ts"]) < THREATFOX_TTL:
        return _threatfox_cache["data"]

    # ThreatFox API requires POST with JSON body
    url = "https://threatfox-api.abuse.ch/api/v1/"
    payload = {
        "query": "get_iocs",
        "days": 1,
    }
    headers = {
        "Content-Type": "application/json",
        "API-KEY": "anonymous",  # ThreatFox accepts anonymous for public IOCs
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status != 200:
                    # Upstream failed — return cached stale data if available, else empty
                    if _threatfox_cache["data"] is not None:
                        return _threatfox_cache["data"]
                    return {
                        "query_status": "ok",
                        "data": [],
                        "source": "fallback_empty",
                    }

                raw = await response.json(content_type=None)

                # ThreatFox returns query_status: "ok" and data array
                if raw.get("query_status") != "ok":
                    if _threatfox_cache["data"] is not None:
                        return _threatfox_cache["data"]
                    return {"query_status": "ok", "data": [], "source": "fallback_empty"}

                # Trim to requested limit
                result = {
                    "query_status": "ok",
                    "data": raw.get("data", [])[:safe_limit],
                    "source": "live",
                }

                # Update cache
                _threatfox_cache["ts"] = now
                _threatfox_cache["data"] = result

                return result

    except Exception as e:
        # Any network/timeout error — return stale cache or empty, never 502
        if _threatfox_cache["data"] is not None:
            stale = dict(_threatfox_cache["data"])
            stale["source"] = "stale_cache"
            return stale
        return {
            "query_status": "ok",
            "data": [],
            "source": "fallback_empty",
            "error": str(e),
        }


@router.get("/email-breach")
async def check_email_breach(email: str):
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    api_key = os.getenv("HIBP_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="HIBP_API_KEY is not configured on the backend")

    headers = {
        "hibp-api-key": api_key,
        "user-agent": "xAtlas-Security-Platform",
        "accept": "application/json",
    }
    url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}"
    params = {"truncateResponse": "false"}

    try:
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status == 404:
                    raise HTTPException(status_code=404, detail="No breaches found")
                if response.status == 429:
                    raise HTTPException(status_code=429, detail="HIBP rate limit reached")
                if response.status in (401, 403):
                    raise HTTPException(status_code=502, detail="HIBP API authorization failed")
                if response.status != 200:
                    detail = await response.text()
                    raise HTTPException(status_code=502, detail=f"HIBP API error: {detail}")
                breaches = await response.json()
                return {"success": True, "email": email, "breaches": breaches}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/check-leak")
async def check_password_leak(request: Request):
    try:
        body = await request.json()
        password = body.get("password", "")
        if not password:
            raise HTTPException(status_code=400, detail="No password provided")

        sha1_hash = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]

        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status != 200:
                    raise HTTPException(status_code=502, detail="Breach API unavailable")
                results = await response.text()
                for line in results.splitlines():
                    hash_suffix, count = line.split(":")
                    if hash_suffix == suffix:
                        return {
                            "success": True,
                            "leaked": True,
                            "count": int(count),
                            "message": f"⚠️ LEAKED {count} times!"
                        }
                return {"success": True, "leaked": False, "count": 0, "message": "✅ No leaks found."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/recon/run")
async def run_recon_command(request: Request):
    try:
        body = await request.json()
        command_key = body.get("command")
        domain = body.get("domain", "").strip()

        if not domain:
            return {"success": False, "output": "Error: No domain provided."}

        clean_domain = (
            domain.replace("http://", "").replace("https://", "")
                  .replace("www.", "").split("/")[0]
        )

        if command_key == "dns_lookup":
            import socket
            try:
                ip_address = socket.gethostbyname(clean_domain)
                return {"success": True, "output": f"IP Address: {ip_address}"}
            except socket.gaierror:
                return {"success": False, "output": f"Error: Could not resolve '{clean_domain}'."}
            except Exception as e:
                return {"success": False, "output": f"Error: {str(e)}"}
        else:
            return {"success": False, "output": "Error: Unknown command."}

    except Exception as e:
        return {"success": False, "output": f"Server Error: {str(e)}"}