import aiohttp

class HIBPService:
    @staticmethod
    async def check_password_prefix(prefix: str) -> list:
        """
        Fetches hash suffixes from Have I Been Pwned.
        Uses k-anonymity: only the 5-char prefix is sent.
        """
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"https://api.pwnedpasswords.com/range/{prefix}") as resp:
                    if resp.status != 200:
                        return []
                    text = await resp.text()
                    # Format: SUFFIX:COUNT
                    return [line.split(':') for line in text.strip().split('\n') if ':' in line]
            except Exception:
                return []