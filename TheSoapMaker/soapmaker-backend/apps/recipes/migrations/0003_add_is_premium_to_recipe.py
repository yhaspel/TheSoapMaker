from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recipes", "0002_add_bookmark_and_step_duration"),
    ]

    operations = [
        migrations.AddField(
            model_name="recipe",
            name="is_premium",
            field=models.BooleanField(
                default=False,
                help_text="Auto-set to True when the author is a premium user at creation time.",
            ),
        ),
    ]
