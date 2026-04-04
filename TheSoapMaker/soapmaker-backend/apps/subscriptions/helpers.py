"""
Subscription helper utilities.
"""


def is_premium(user) -> bool:
    """
    Return True if the user has an active or trialing premium subscription.

    Falls back to the denormalized ``user.is_premium`` flag when no
    Subscription row exists (e.g. free users who have never subscribed).
    """
    try:
        return user.subscription.is_premium_active
    except Exception:
        return bool(user.is_premium)
