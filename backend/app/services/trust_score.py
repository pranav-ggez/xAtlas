def calculate_trust_score(tool_dict: dict) -> int:
    """
    Calculates T.R.U.S.T. Score (0-100) based on tool metrics.
    """
    score = 50  # Base score
    
    # T: Threat Exposure (Deduct for CVEs)
    cve_count = tool_dict.get("cve_count", 0)
    score -= min(25, cve_count * 5)
    
    # S: Supply Chain (Add for signed releases)
    if tool_dict.get("signed_releases"):
        score += 15
        
    # Clamp score between 0 and 100
    return max(0, min(100, score))