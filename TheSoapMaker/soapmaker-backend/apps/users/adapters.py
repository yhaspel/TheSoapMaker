from allauth.account.adapter import DefaultAccountAdapter


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Extends the default allauth adapter to:
    - Disable username (email-only accounts)
    - Let CustomUser.save() handle trial field population automatically
    """

    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        # Trial fields (trial_started_at / trial_ends_at) are auto-set by
        # CustomUser.save() on first save, so no extra logic is needed here.
        if commit:
            user.save()
        return user
