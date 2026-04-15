from fastapi import APIRouter, Request, HTTPException
import hashlib
import aiohttp
import subprocess
import json

router = APIRouter(prefix="/api/security", tags=["security"])

@router.post("/check-leak")
async def check_password_leak(request: Request):
    try:
        body = await request.json()
        password = body.get("password", "")
        
        if not password:
            raise HTTPException(status_code=400, detail="No password provided")
        
        sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"https://api.pwnedpasswords.com/range/{prefix}") as response:
                if response.status != 200:
                    raise HTTPException(status_code=502, detail="Breach API unavailable")
                
                results = await response.text()
                
                for line in results.splitlines():
                    hash_suffix, count = line.split(':')
                    if hash_suffix == suffix:
                        return {
                            "success": True,
                            "leaked": True,
                            "count": int(count),
                            "message": f"⚠️ LEAKED {count} times!"
                        }
                
                return {
                    "success": True,
                    "leaked": False,
                    "count": 0,
                    "message": "✅ No leaks found."
                }
                
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

        # Clean the domain (remove http://, https://, www., trailing slashes)
        clean_domain = domain.replace('http://', '').replace('https://', '').replace('www.', '').split('/')[0]

        if command_key == "dns_lookup":
            # Use Python's socket library for a safe, cross-platform DNS lookup
            import socket
            try:
                ip_address = socket.gethostbyname(clean_domain)
                return {
                    "success": True,
                    "output": f"IP Address: {ip_address}"
                }
            except socket.gaierror:
                return {
                    "success": False,
                    "output": f"Error: Could not resolve '{clean_domain}'. Check if the domain is valid."
                }
            except Exception as e:
                return {
                    "success": False,
                    "output": f"Error: {str(e)}"
                }
        
        else:
            return {"success": False, "output": "Error: Unknown command."}

    except Exception as e:
        return {"success": False, "output": f"Server Error: {str(e)}"}