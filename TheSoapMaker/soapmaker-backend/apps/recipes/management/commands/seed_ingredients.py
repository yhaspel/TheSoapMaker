"""
Management command: seed_ingredients

Idempotently populates the Ingredient table with ~30 common soap-making
ingredients and their NaOH saponification values.

Usage:
    python manage.py seed_ingredients
"""

from django.core.management.base import BaseCommand

from apps.recipes.models import Ingredient

# NaOH SAP values: grams of NaOH needed to saponify 1 gram of the oil/fat.
INGREDIENTS = [
    # Oils & Fats
    {
        "name": "Coconut Oil (76°)",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.190,
        "description": "High-lathering oil that adds hardness and cleansing. Best used at 20–30% of batch.",
    },
    {
        "name": "Olive Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.134,
        "description": "Conditioning oil that produces a creamy lather. Can be used up to 100% (Castile).",
    },
    {
        "name": "Palm Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.141,
        "description": "Adds hardness and stable lather. Use sustainably sourced palm.",
    },
    {
        "name": "Castor Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.128,
        "description": "Boosts lather and helps other oils lather. Use at 5–10%.",
    },
    {
        "name": "Shea Butter",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.128,
        "description": "Rich, creamy butter that adds conditioning and skin-softening properties.",
    },
    {
        "name": "Sweet Almond Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.136,
        "description": "Light, skin-softening oil good for sensitive skin.",
    },
    {
        "name": "Avocado Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.133,
        "description": "Nourishing oil high in vitamins A, D, and E. Great for dry skin.",
    },
    {
        "name": "Cocoa Butter",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.137,
        "description": "Hard butter that adds hardness and a light chocolatey scent.",
    },
    {
        "name": "Lard (Pork)",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.138,
        "description": "Traditional soap-making fat that creates hard, mild bars with creamy lather.",
    },
    {
        "name": "Tallow (Beef)",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.140,
        "description": "Animal fat that produces very hard, long-lasting bars.",
    },
    {
        "name": "Sunflower Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.134,
        "description": "Light conditioning oil high in linoleic acid. Use at 10–15% to avoid DOS.",
    },
    {
        "name": "Canola Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.132,
        "description": "Affordable conditioning oil with a good fatty acid profile.",
    },
    {
        "name": "Hemp Seed Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.135,
        "description": "Skin-conditioning oil with a balanced omega-3 and omega-6 profile.",
    },
    {
        "name": "Neem Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.136,
        "description": "Medicinal oil with a strong scent. Good for acne-prone skin. Use at 5–10%.",
    },
    {
        "name": "Argan Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.136,
        "description": "Luxury conditioning oil. Best as a superfat at low percentages.",
    },
    {
        "name": "Rice Bran Oil",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.128,
        "description": "Mild, conditioning oil that is gentle on skin.",
    },
    {
        "name": "Mango Butter",
        "category": Ingredient.Category.OIL,
        "saponification_value": 0.137,
        "description": "Emollient butter that adds hardness and moisturizing properties.",
    },
    # Lye
    {
        "name": "Sodium Hydroxide (NaOH)",
        "category": Ingredient.Category.LYE,
        "saponification_value": None,
        "description": "Lye used for solid/bar soap. Always add lye to liquid, never the reverse. Caustic — use PPE.",
    },
    {
        "name": "Potassium Hydroxide (KOH)",
        "category": Ingredient.Category.LYE,
        "saponification_value": None,
        "description": "Lye used for liquid/soft soap. Typically 90% purity — adjust calculations accordingly.",
    },
    # Liquids
    {
        "name": "Distilled Water",
        "category": Ingredient.Category.LIQUID,
        "saponification_value": None,
        "description": "Standard soap-making liquid. Use distilled to avoid mineral interference.",
    },
    {
        "name": "Goat Milk",
        "category": Ingredient.Category.LIQUID,
        "saponification_value": None,
        "description": "Adds creaminess and skin-softening lactic acid. Freeze before adding lye.",
    },
    {
        "name": "Coconut Milk",
        "category": Ingredient.Category.LIQUID,
        "saponification_value": None,
        "description": "Creates a rich, creamy lather. Substitute part or all of the water.",
    },
    {
        "name": "Aloe Vera Juice",
        "category": Ingredient.Category.LIQUID,
        "saponification_value": None,
        "description": "Soothing liquid substitute. Adds skin-calming properties.",
    },
    # Additives
    {
        "name": "Sodium Lactate",
        "category": Ingredient.Category.ADDITIVE,
        "saponification_value": None,
        "description": "Speeds up unmolding. Add to cooled lye solution at 1 tsp per 500g oils.",
    },
    {
        "name": "Kaolin Clay",
        "category": Ingredient.Category.ADDITIVE,
        "saponification_value": None,
        "description": "Adds slip and a silky feel. Use at 1 tsp per 500g oils.",
    },
    {
        "name": "Activated Charcoal",
        "category": Ingredient.Category.ADDITIVE,
        "saponification_value": None,
        "description": "Detoxifying additive. Creates a striking black colour. Use 1 tsp per 500g oils.",
    },
    {
        "name": "Oatmeal (Colloidal)",
        "category": Ingredient.Category.ADDITIVE,
        "saponification_value": None,
        "description": "Soothing exfoliant suitable for sensitive skin.",
    },
    # Fragrances
    {
        "name": "Lavender Essential Oil",
        "category": Ingredient.Category.FRAGRANCE,
        "saponification_value": None,
        "description": "Classic, calming floral scent. Behaves reliably in cold-process soap.",
    },
    {
        "name": "Peppermint Essential Oil",
        "category": Ingredient.Category.FRAGRANCE,
        "saponification_value": None,
        "description": "Fresh, invigorating scent. Can accelerate trace — test first.",
    },
    {
        "name": "Tea Tree Essential Oil",
        "category": Ingredient.Category.FRAGRANCE,
        "saponification_value": None,
        "description": "Antimicrobial with a clean, medicinal scent. Popular for acne soap.",
    },
    # Colorants
    {
        "name": "Titanium Dioxide",
        "category": Ingredient.Category.COLORANT,
        "saponification_value": None,
        "description": "White colorant. Mix with a small amount of oil before adding to batter.",
    },
    {
        "name": "Mica Powder",
        "category": Ingredient.Category.COLORANT,
        "saponification_value": None,
        "description": "Available in many colours. Cosmetic-grade micas are skin-safe.",
    },
    {
        "name": "Spirulina Powder",
        "category": Ingredient.Category.COLORANT,
        "saponification_value": None,
        "description": "Natural green colorant derived from algae. May fade over time.",
    },
]


class Command(BaseCommand):
    help = "Seed the database with common soap-making ingredients (idempotent)."

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for data in INGREDIENTS:
            obj, created = Ingredient.objects.update_or_create(
                name=data["name"],
                defaults={
                    "category": data["category"],
                    "saponification_value": data["saponification_value"],
                    "description": data["description"],
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {created_count} ingredients created, {updated_count} updated. "
                f"Total ingredients in DB: {Ingredient.objects.count()}"
            )
        )
