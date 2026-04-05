"""
Management command: seed_recipes

Seeds the database with 20 authentic handcrafted soap recipes drawn from
classic cold-process, hot-process, melt-and-pour, and liquid soap traditions.

Requires ingredients to be present — run seed_ingredients first, or pass
--with-ingredients to seed them automatically.

Usage:
    python manage.py seed_recipes
    python manage.py seed_recipes --with-ingredients
    python manage.py seed_recipes --author-email admin@example.com
"""

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from apps.recipes.models import Ingredient, Recipe, RecipeIngredient, Step, Tag

User = get_user_model()

# ---------------------------------------------------------------------------
# Recipe data
# Each recipe dict has:
#   name, description, method, difficulty, cure_time_days, batch_size_grams,
#   yield_bars, tags (list of str), average_rating, rating_count,
#   ingredients (list of {name, amount_grams, percentage, notes}),
#   steps     (list of {instruction, duration_minutes})
# ---------------------------------------------------------------------------
RECIPES = [
    # ── 1 ────────────────────────────────────────────────────────────────────
    {
        "name": "Classic Castile Bar",
        "image_url": "/media/recipe-images/classic-castile-bar.jpg",
        "description": (
            "The purest soap you can make — 100% extra-virgin olive oil saponified "
            "with sodium hydroxide. Castile soap is legendary for its gentle, "
            "creamy lather and extraordinary mildness. This recipe produces a soft "
            "bar straight from the mould that hardens and improves dramatically with "
            "a long cure. Patience is the key ingredient."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.BEGINNER,
        "cure_time_days": 42,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["castile", "vegan", "sensitive-skin", "olive-oil"],
        "average_rating": 4.6,
        "rating_count": 38,
        "ingredients": [
            {"name": "Olive Oil",              "amount_grams": 500,  "percentage": 92.0, "notes": "Extra-virgin preferred"},
            {"name": "Castor Oil",             "amount_grams": 25,   "percentage": 4.6,  "notes": "Boosts lather"},
            {"name": "Sodium Hydroxide (NaOH)","amount_grams": 71,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",        "amount_grams": 178,  "percentage": None, "notes": "33% water discount"},
        ],
        "steps": [
            {"instruction": "Weigh and prepare all ingredients. Put on safety goggles and gloves.", "duration_minutes": 5},
            {"instruction": "Slowly add sodium hydroxide to the distilled water in a heat-safe container, stirring gently until fully dissolved. The solution will heat up — this is normal. Set aside to cool to around 38°C.", "duration_minutes": 15},
            {"instruction": "Gently warm the olive oil and castor oil together to about 38°C.", "duration_minutes": 10},
            {"instruction": "When both lye solution and oils are at similar temperatures, slowly pour the lye solution into the oils while stick-blending in short bursts.", "duration_minutes": 5},
            {"instruction": "Continue blending until the batter reaches a light trace — it should look like thin custard and leave a faint trail on the surface.", "duration_minutes": 10},
            {"instruction": "Pour into a lined loaf mould. Cover with a piece of cardboard and insulate with a towel for 24 hours to encourage full saponification.", "duration_minutes": 5},
            {"instruction": "Unmould after 24–48 hours and slice into bars. Place on a drying rack with space between bars. Cure in a cool, airy spot for at least 42 days — the longer the better for a Castile.", "duration_minutes": 10},
        ],
    },
    # ── 2 ────────────────────────────────────────────────────────────────────
    {
        "name": "Lavender Dream Bar",
        "image_url": "/media/recipe-images/lavender-dream-bar.jpg",
        "description": (
            "A beautifully balanced everyday bar combining the cleansing power of "
            "coconut oil with the gentle conditioning of olive oil. Scented with "
            "lavender essential oil, this is the perfect introduction to cold-process "
            "soap making. The bar is firm, produces a lovely creamy lather, and fills "
            "the shower with a calming floral fragrance."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.BEGINNER,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["lavender", "beginner", "everyday", "floral"],
        "average_rating": 4.8,
        "rating_count": 62,
        "ingredients": [
            {"name": "Olive Oil",              "amount_grams": 225,  "percentage": 45.0, "notes": ""},
            {"name": "Coconut Oil (76°)",      "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Shea Butter",            "amount_grams": 75,   "percentage": 15.0, "notes": ""},
            {"name": "Castor Oil",             "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)","amount_grams": 72,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",        "amount_grams": 180,  "percentage": None, "notes": ""},
            {"name": "Lavender Essential Oil", "amount_grams": 15,   "percentage": None, "notes": "Added at trace"},
        ],
        "steps": [
            {"instruction": "Measure all oils and butters. Melt coconut oil and shea butter in a double boiler or microwave if solid.", "duration_minutes": 10},
            {"instruction": "Put on PPE. Carefully dissolve sodium hydroxide in distilled water, stirring constantly. Allow to cool to 38–43°C.", "duration_minutes": 15},
            {"instruction": "Combine all oils (including liquid olive and castor) and ensure they're at 38–43°C.", "duration_minutes": 5},
            {"instruction": "Pour the lye solution into the oils in a thin stream, stick-blending in 10-second bursts with rest periods.", "duration_minutes": 5},
            {"instruction": "Blend to a medium trace (like thick custard). Stir in lavender essential oil by hand and mix thoroughly.", "duration_minutes": 5},
            {"instruction": "Pour into a prepared loaf mould. Tap gently to release air bubbles. Cover and insulate for 24 hours.", "duration_minutes": 3},
            {"instruction": "Unmould, slice into 8 bars, and cure on a rack for 28 days, turning weekly.", "duration_minutes": 10},
        ],
    },
    # ── 3 ────────────────────────────────────────────────────────────────────
    {
        "name": "Goat Milk & Honey Bar",
        "image_url": "/media/recipe-images/goat-milk-honey-bar.jpg",
        "description": (
            "Goat milk is packed with lactic acid, vitamins A and B, and natural "
            "fats that make it a superb skin-conditioning liquid. Paired with raw "
            "honey for humectant sweetness and a touch of palm oil for a hard, "
            "long-lasting bar, this recipe is a perennial community favourite. "
            "The milk sugars give the bar a warm, creamy colour and a naturally "
            "sweet scent."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 600,
        "yield_bars": 9,
        "tags": ["goat-milk", "honey", "conditioning", "creamy"],
        "average_rating": 4.7,
        "rating_count": 45,
        "ingredients": [
            {"name": "Olive Oil",              "amount_grams": 240,  "percentage": 40.0, "notes": ""},
            {"name": "Coconut Oil (76°)",      "amount_grams": 180,  "percentage": 30.0, "notes": ""},
            {"name": "Palm Oil",               "amount_grams": 120,  "percentage": 20.0, "notes": "Sustainably sourced"},
            {"name": "Castor Oil",             "amount_grams": 30,   "percentage": 5.0,  "notes": ""},
            {"name": "Shea Butter",            "amount_grams": 30,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)","amount_grams": 84,   "percentage": None, "notes": "5% superfat"},
            {"name": "Goat Milk",              "amount_grams": 210,  "percentage": None, "notes": "Frozen solid before use"},
            {"name": "Sodium Lactate",         "amount_grams": 6,    "percentage": None, "notes": "1 tsp per 500g oils — aids unmoulding"},
        ],
        "steps": [
            {"instruction": "Freeze goat milk into cubes the night before. This prevents scorching and darkening when lye is added.", "duration_minutes": 5},
            {"instruction": "Place frozen goat milk into a large bowl surrounded by an ice bath. Slowly sprinkle sodium hydroxide over the frozen milk, stirring constantly. Never add all the lye at once — go slowly to keep temperatures below 21°C. The mixture will turn orange; this is normal.", "duration_minutes": 20},
            {"instruction": "Once fully dissolved, stir in sodium lactate. Allow the lye-milk mixture to cool to around 21–27°C.", "duration_minutes": 10},
            {"instruction": "Melt coconut oil, palm oil, and shea butter together. Add olive and castor oils. Bring to around 30°C.", "duration_minutes": 10},
            {"instruction": "Pour the cooled lye-milk mixture into the oils, blending to a light trace.", "duration_minutes": 5},
            {"instruction": "Add 1 tablespoon of raw honey (optional) at light trace, stir well. Pour into a lined mould.", "duration_minutes": 5},
            {"instruction": "Do NOT insulate — milk soaps can overheat. Leave uncovered in a cool room. Unmould after 24 hours and cure for 28 days.", "duration_minutes": 5},
        ],
    },
    # ── 4 ────────────────────────────────────────────────────────────────────
    {
        "name": "Activated Charcoal Detox Bar",
        "image_url": "/media/recipe-images/activated-charcoal-detox-bar.jpg",
        "description": (
            "Black, striking, and powerful — this detox bar combines the pore-purifying "
            "action of activated charcoal with the antimicrobial properties of tea tree "
            "essential oil. It's a brilliant bar for oily or acne-prone skin and looks "
            "dramatic in any bathroom. The activated charcoal binds to impurities and "
            "draws them out of the skin."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["charcoal", "detox", "acne", "tea-tree", "oily-skin"],
        "average_rating": 4.5,
        "rating_count": 29,
        "ingredients": [
            {"name": "Coconut Oil (76°)",       "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Olive Oil",               "amount_grams": 200,  "percentage": 40.0, "notes": ""},
            {"name": "Castor Oil",              "amount_grams": 50,   "percentage": 10.0, "notes": "Boosts charcoal lather"},
            {"name": "Shea Butter",             "amount_grams": 75,   "percentage": 15.0, "notes": "Conditioning"},
            {"name": "Sodium Hydroxide (NaOH)", "amount_grams": 73,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",         "amount_grams": 182,  "percentage": None, "notes": ""},
            {"name": "Activated Charcoal",      "amount_grams": 5,    "percentage": None, "notes": "1 tsp per 500g oils, mixed into trace"},
            {"name": "Tea Tree Essential Oil",  "amount_grams": 10,   "percentage": None, "notes": "Added at trace"},
        ],
        "steps": [
            {"instruction": "Prepare your workspace and put on PPE. Pre-mix the activated charcoal with a tablespoon of the weighed oils to form a smooth paste — this prevents clumping.", "duration_minutes": 5},
            {"instruction": "Dissolve sodium hydroxide in distilled water. Stir until clear and allow to cool to 38°C.", "duration_minutes": 15},
            {"instruction": "Melt coconut oil and shea butter if solid. Combine all oils and bring to 38°C.", "duration_minutes": 10},
            {"instruction": "Pour lye solution into oils and blend to a light trace.", "duration_minutes": 5},
            {"instruction": "Add the activated charcoal paste and tea tree essential oil. Stick-blend briefly to combine evenly — the batter will turn jet black.", "duration_minutes": 5},
            {"instruction": "Pour into mould. Cover and insulate for 24 hours.", "duration_minutes": 3},
            {"instruction": "Unmould and slice. Cure for 28 days. The bars will stay black throughout the cure.", "duration_minutes": 10},
        ],
    },
    # ── 5 ────────────────────────────────────────────────────────────────────
    {
        "name": "Peppermint Foot Scrub Bar",
        "image_url": "/media/recipe-images/peppermint-foot-scrub-bar.jpg",
        "description": (
            "A refreshing, tingly bar formulated specifically for hard-working feet. "
            "Peppermint essential oil provides an invigorating cooling sensation while "
            "colloidal oatmeal gently exfoliates rough skin. This is a great gift bar "
            "and holds its scent well thanks to the high castor oil percentage which "
            "helps bind fragrance."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["peppermint", "foot-care", "exfoliant", "scrub", "cooling"],
        "average_rating": 4.4,
        "rating_count": 22,
        "ingredients": [
            {"name": "Coconut Oil (76°)",       "amount_grams": 200,  "percentage": 40.0, "notes": "High for cleansing"},
            {"name": "Olive Oil",               "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Castor Oil",              "amount_grams": 75,   "percentage": 15.0, "notes": "High % helps with lather and scent retention"},
            {"name": "Shea Butter",             "amount_grams": 50,   "percentage": 10.0, "notes": "Softens rough skin"},
            {"name": "Sodium Hydroxide (NaOH)", "amount_grams": 75,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",         "amount_grams": 188,  "percentage": None, "notes": ""},
            {"name": "Peppermint Essential Oil","amount_grams": 15,   "percentage": None, "notes": "3% usage rate"},
            {"name": "Oatmeal (Colloidal)",     "amount_grams": 10,   "percentage": None, "notes": "Sprinkled on top after pouring"},
        ],
        "steps": [
            {"instruction": "Prepare all ingredients. Measure peppermint essential oil and set aside.", "duration_minutes": 5},
            {"instruction": "Dissolve NaOH in water. Cool to 38°C.", "duration_minutes": 15},
            {"instruction": "Melt coconut oil and shea butter. Combine with olive and castor oils at 38°C.", "duration_minutes": 10},
            {"instruction": "Blend lye and oils to a light trace.", "duration_minutes": 5},
            {"instruction": "Add peppermint essential oil and stir by hand to combine. Note: peppermint can accelerate trace — work quickly.", "duration_minutes": 3},
            {"instruction": "Pour into mould. Immediately sprinkle colloidal oatmeal over the top surface and gently press it in.", "duration_minutes": 3},
            {"instruction": "Cover and insulate for 24 hours. Unmould, slice, and cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 6 ────────────────────────────────────────────────────────────────────
    {
        "name": "Avocado & Hemp Luxury Bar",
        "image_url": "/media/recipe-images/avocado-hemp-luxury-bar.jpg",
        "description": (
            "A skin-nourishing luxury bar packed with fatty acids. Avocado oil is "
            "rich in vitamins A, D, and E while hemp seed oil delivers the perfect "
            "balance of omega-3 and omega-6 fatty acids. This bar is particularly "
            "suited to dry or mature skin types. The resulting bar is soft, creamy, "
            "and deeply conditioning."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 35,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["avocado", "hemp", "luxury", "dry-skin", "nourishing"],
        "average_rating": 4.3,
        "rating_count": 17,
        "ingredients": [
            {"name": "Olive Oil",               "amount_grams": 175,  "percentage": 35.0, "notes": "Base conditioning"},
            {"name": "Coconut Oil (76°)",        "amount_grams": 150,  "percentage": 30.0, "notes": ""},
            {"name": "Avocado Oil",              "amount_grams": 100,  "percentage": 20.0, "notes": ""},
            {"name": "Hemp Seed Oil",            "amount_grams": 50,   "percentage": 10.0, "notes": "Add at trace to preserve fatty acids"},
            {"name": "Castor Oil",               "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 70,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",          "amount_grams": 175,  "percentage": None, "notes": ""},
            {"name": "Lavender Essential Oil",   "amount_grams": 12,   "percentage": None, "notes": "Optional — added at trace"},
        ],
        "steps": [
            {"instruction": "Weigh all ingredients. Set hemp seed oil aside — it will be added at trace to preserve its delicate fatty acids.", "duration_minutes": 5},
            {"instruction": "Dissolve NaOH in distilled water. Cool to 35°C.", "duration_minutes": 15},
            {"instruction": "Warm coconut oil until just melted. Combine with olive, avocado, and castor oils at 35°C.", "duration_minutes": 10},
            {"instruction": "Combine lye solution and oils. Blend to a light trace.", "duration_minutes": 5},
            {"instruction": "Add hemp seed oil at light trace (not before — heat can degrade it). Add lavender EO if using. Stir by hand.", "duration_minutes": 5},
            {"instruction": "Pour into prepared mould. Cover and insulate lightly for 18–24 hours.", "duration_minutes": 3},
            {"instruction": "Unmould after 24 hours, slice, and cure for 35 days. This bar benefits from a long cure due to the high conditioning oils.", "duration_minutes": 10},
        ],
    },
    # ── 7 ────────────────────────────────────────────────────────────────────
    {
        "name": "Rustic Hot Process Soap",
        "image_url": "/media/recipe-images/rustic-hot-process-soap.jpg",
        "description": (
            "Hot process soap is the 'no waiting' sibling of cold process — the "
            "saponification reaction is cooked to completion in the pot, so the bar "
            "is safe to use almost immediately after cutting. The result has a more "
            "rustic, textured appearance that many soap makers love. This classic "
            "recipe uses a tried-and-true oil blend."
        ),
        "method": Recipe.Method.HOT_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 7,
        "batch_size_grams": 600,
        "yield_bars": 9,
        "tags": ["hot-process", "rustic", "quick-cure", "classic"],
        "average_rating": 4.2,
        "rating_count": 19,
        "ingredients": [
            {"name": "Coconut Oil (76°)",       "amount_grams": 180,  "percentage": 30.0, "notes": ""},
            {"name": "Palm Oil",                "amount_grams": 180,  "percentage": 30.0, "notes": "Adds hardness"},
            {"name": "Olive Oil",               "amount_grams": 180,  "percentage": 30.0, "notes": ""},
            {"name": "Castor Oil",              "amount_grams": 60,   "percentage": 10.0, "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)", "amount_grams": 85,   "percentage": None, "notes": "0% superfat — add superfat oils at the end"},
            {"name": "Distilled Water",         "amount_grams": 213,  "percentage": None, "notes": ""},
            {"name": "Shea Butter",             "amount_grams": 30,   "percentage": None, "notes": "Added at end of cook as superfat"},
            {"name": "Lavender Essential Oil",  "amount_grams": 18,   "percentage": None, "notes": "Added after cook"},
        ],
        "steps": [
            {"instruction": "Prepare the lye solution and allow to cool slightly. Melt all oils together in a slow cooker or heavy pot on the lowest setting.", "duration_minutes": 15},
            {"instruction": "Pour lye into oils and stick-blend to a thick trace.", "duration_minutes": 10},
            {"instruction": "Cover and cook on low, stirring every 15–20 minutes. The batter will go through stages: applesauce, mashed potato, and finally a glossy, translucent stage. This typically takes 45–60 minutes.", "duration_minutes": 60},
            {"instruction": "Test for completion with a pH strip (should read 8–9) or the zap test: touch a tiny piece to your tongue — no zap means no active lye.", "duration_minutes": 5},
            {"instruction": "Remove from heat. Stir in shea butter until melted. Allow temperature to drop to around 65°C, then stir in lavender essential oil.", "duration_minutes": 10},
            {"instruction": "Press the cooked soap into a lined mould using a spatula — it won't flow like cold process. Smooth the top as best you can. Cool for 24 hours.", "duration_minutes": 10},
            {"instruction": "Unmould and slice. Cure for at least 7 days to allow moisture to evaporate and bars to harden.", "duration_minutes": 10},
        ],
    },
    # ── 8 ────────────────────────────────────────────────────────────────────
    {
        "name": "Liquid Castile Soap",
        "image_url": "/media/recipe-images/liquid-castile-soap.jpg",
        "description": (
            "A silky, gentle liquid soap made with potassium hydroxide and olive oil. "
            "Liquid Castile is incredibly versatile — use it as a body wash, gentle "
            "hand soap, baby wash, or diluted as a household cleaner. This is the "
            "liquid equivalent of the classic bar, and the resulting paste can be "
            "diluted to the desired consistency."
        ),
        "method": Recipe.Method.LIQUID,
        "difficulty": Recipe.Difficulty.ADVANCED,
        "cure_time_days": 14,
        "batch_size_grams": 500,
        "yield_bars": 1,
        "tags": ["liquid-soap", "castile", "multipurpose", "gentle", "vegan"],
        "average_rating": 4.5,
        "rating_count": 14,
        "ingredients": [
            {"name": "Olive Oil",                  "amount_grams": 450,  "percentage": 90.0, "notes": ""},
            {"name": "Castor Oil",                 "amount_grams": 50,   "percentage": 10.0, "notes": "Improves lather in liquid soap"},
            {"name": "Potassium Hydroxide (KOH)",  "amount_grams": 79,   "percentage": None, "notes": "90% purity KOH; 3% superfat"},
            {"name": "Distilled Water",            "amount_grams": 500,  "percentage": None, "notes": "Higher water ratio than bar soap"},
        ],
        "steps": [
            {"instruction": "Liquid soap requires a higher water ratio. Prepare your space carefully — KOH is even more caustic than NaOH in solution.", "duration_minutes": 5},
            {"instruction": "Dissolve KOH in distilled water (adjust for 90% purity if needed: divide ideal KOH by 0.90). The solution will heat intensely. Cool to 65°C.", "duration_minutes": 15},
            {"instruction": "Warm oils to 65°C in a slow cooker. Pour the KOH solution into the oils.", "duration_minutes": 5},
            {"instruction": "Stick-blend until the mixture reaches trace, then continue cooking on low heat, stirring regularly. Liquid soap paste goes through a taffy-like stage before becoming glossy and translucent. This can take 2–4 hours.", "duration_minutes": 180},
            {"instruction": "Test with a small amount dissolved in boiling water — it should be clear or slightly hazy. Milky-white indicates incomplete saponification; continue cooking.", "duration_minutes": 10},
            {"instruction": "Once done, dilute the paste by adding boiling distilled water in small amounts, stirring until you reach your desired consistency. A 1:1 ratio of paste to water makes a medium-thick liquid soap.", "duration_minutes": 20},
            {"instruction": "Allow to sit for 24–48 hours to fully neutralise and clarify. Bottle and label. Use within 12 months.", "duration_minutes": 5},
        ],
    },
    # ── 9 ────────────────────────────────────────────────────────────────────
    {
        "name": "Cocoa Butter & Vanilla Dream",
        "image_url": "/media/recipe-images/cocoa-butter-vanilla-dream.jpg",
        "description": (
            "Luxurious and indulgent, this bar combines the hardness and subtle "
            "chocolatey note of cocoa butter with the sweet warmth of vanilla. "
            "Cocoa butter is naturally rich in fatty acids that leave skin feeling "
            "velvety soft. Paired with a gentle blend of olive and coconut oils, "
            "this bar makes a wonderful gift."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["cocoa-butter", "vanilla", "luxury", "gift", "moisturising"],
        "average_rating": 4.9,
        "rating_count": 51,
        "ingredients": [
            {"name": "Olive Oil",               "amount_grams": 200,  "percentage": 40.0, "notes": ""},
            {"name": "Coconut Oil (76°)",        "amount_grams": 150,  "percentage": 30.0, "notes": ""},
            {"name": "Cocoa Butter",             "amount_grams": 100,  "percentage": 20.0, "notes": "Deodorised preferred for clean vanilla scent"},
            {"name": "Castor Oil",               "amount_grams": 50,   "percentage": 10.0, "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 71,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",          "amount_grams": 178,  "percentage": None, "notes": ""},
        ],
        "steps": [
            {"instruction": "Melt coconut oil and cocoa butter together over low heat — cocoa butter has a higher melting point, so give it time.", "duration_minutes": 10},
            {"instruction": "Dissolve NaOH in water, stir until clear, and cool to 40°C.", "duration_minutes": 15},
            {"instruction": "Combine melted butters with olive and castor oils at 40°C.", "duration_minutes": 5},
            {"instruction": "Pour lye solution into oils and blend to a medium trace. Note that cocoa butter can accelerate trace.", "duration_minutes": 5},
            {"instruction": "Pour into a lined mould. Tap to remove air bubbles. Cover and insulate for 24 hours.", "duration_minutes": 3},
            {"instruction": "Unmould and slice. The bar will have a firm, creamy colour. Cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 10 ───────────────────────────────────────────────────────────────────
    {
        "name": "Tea Tree & Neem Acne Bar",
        "image_url": "/media/recipe-images/tea-tree-neem-acne-bar.jpg",
        "description": (
            "A targeted bar formulated for acne-prone and problematic skin. Neem oil "
            "has been used for centuries in Ayurvedic skin care for its powerful "
            "antibacterial and anti-inflammatory properties. Combined with tea tree "
            "essential oil and kept at a low superfat to avoid pore-clogging oils, "
            "this bar is a gentle but effective treatment bar."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.ADVANCED,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["tea-tree", "neem", "acne", "oily-skin", "antibacterial"],
        "average_rating": 4.4,
        "rating_count": 23,
        "ingredients": [
            {"name": "Coconut Oil (76°)",        "amount_grams": 225,  "percentage": 45.0, "notes": "High coconut for deep cleanse"},
            {"name": "Olive Oil",                "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Castor Oil",               "amount_grams": 50,   "percentage": 10.0, "notes": ""},
            {"name": "Neem Oil",                 "amount_grams": 50,   "percentage": 10.0, "notes": "Strong smell — EO will help mask it"},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 76,   "percentage": None, "notes": "3% superfat (lower for acne bar)"},
            {"name": "Distilled Water",          "amount_grams": 190,  "percentage": None, "notes": ""},
            {"name": "Tea Tree Essential Oil",   "amount_grams": 15,   "percentage": None, "notes": "3% usage rate"},
            {"name": "Activated Charcoal",       "amount_grams": 3,    "percentage": None, "notes": "Half a teaspoon — optional"},
        ],
        "steps": [
            {"instruction": "Important: neem oil has a very strong, garlicky smell. Work in a well-ventilated area. The tea tree EO will help counteract it.", "duration_minutes": 3},
            {"instruction": "Dissolve NaOH in water. Cool to 38°C.", "duration_minutes": 15},
            {"instruction": "Melt coconut oil. Combine with olive, castor, and neem oils at 38°C.", "duration_minutes": 10},
            {"instruction": "If using activated charcoal, mix it with a teaspoon of the weighed oils to form a paste.", "duration_minutes": 5},
            {"instruction": "Blend lye and oils to a light trace. Add the charcoal paste and tea tree EO, blend briefly to incorporate.", "duration_minutes": 5},
            {"instruction": "Pour into mould, cover and insulate. Unmould after 24–48 hours.", "duration_minutes": 3},
            {"instruction": "Slice and cure for 28 days. The neem smell will mellow significantly during the cure.", "duration_minutes": 10},
        ],
    },
    # ── 11 ───────────────────────────────────────────────────────────────────
    {
        "name": "Oatmeal & Honey Sensitive Bar",
        "image_url": "/media/recipe-images/oatmeal-honey-sensitive-bar.jpg",
        "description": (
            "Crafted for the most sensitive of skin types, this gentle bar contains "
            "colloidal oatmeal — finely milled oats that have been shown in clinical "
            "studies to relieve itching and irritation — along with raw honey as a "
            "natural humectant. Free from fragrances, this is a bar suitable for "
            "babies, eczema-prone skin, and allergy sufferers."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.BEGINNER,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["oatmeal", "honey", "sensitive-skin", "fragrance-free", "eczema"],
        "average_rating": 4.7,
        "rating_count": 33,
        "ingredients": [
            {"name": "Olive Oil",               "amount_grams": 250,  "percentage": 50.0, "notes": "Gentle base"},
            {"name": "Coconut Oil (76°)",        "amount_grams": 150,  "percentage": 30.0, "notes": ""},
            {"name": "Shea Butter",              "amount_grams": 75,   "percentage": 15.0, "notes": "Extra conditioning"},
            {"name": "Castor Oil",               "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 71,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",          "amount_grams": 178,  "percentage": None, "notes": ""},
            {"name": "Oatmeal (Colloidal)",      "amount_grams": 15,   "percentage": None, "notes": "Fine milled — added at trace"},
        ],
        "steps": [
            {"instruction": "Make colloidal oatmeal: blend rolled oats in a food processor to a very fine powder. Sift to remove any large pieces.", "duration_minutes": 5},
            {"instruction": "Dissolve NaOH in distilled water. Cool to 38°C.", "duration_minutes": 15},
            {"instruction": "Melt coconut oil and shea butter. Combine with olive and castor oils at 38°C.", "duration_minutes": 10},
            {"instruction": "Blend lye and oils to a light trace.", "duration_minutes": 5},
            {"instruction": "Stir in colloidal oatmeal and 1 tablespoon raw honey by hand. The honey may accelerate trace slightly.", "duration_minutes": 5},
            {"instruction": "Pour into mould. This bar can benefit from a partial gel phase — insulate lightly for 12 hours, then uncover.", "duration_minutes": 3},
            {"instruction": "Unmould after 48 hours (honey can slow hardening), slice, and cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 12 ───────────────────────────────────────────────────────────────────
    {
        "name": "Aloe Vera Moisture Bar",
        "image_url": "/media/recipe-images/aloe-vera-moisture-bar.jpg",
        "description": (
            "Aloe vera juice replaces all of the water in this deeply hydrating bar. "
            "Aloe contains polysaccharides and enzymes that soothe sunburn, reduce "
            "inflammation, and moisturise dry skin. This bar is suitable for use "
            "after sun exposure, or simply as an everyday moisturising wash for "
            "dry or combination skin."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["aloe-vera", "moisturising", "soothing", "dry-skin", "aftersun"],
        "average_rating": 4.6,
        "rating_count": 27,
        "ingredients": [
            {"name": "Olive Oil",               "amount_grams": 225,  "percentage": 45.0, "notes": ""},
            {"name": "Coconut Oil (76°)",        "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Shea Butter",              "amount_grams": 75,   "percentage": 15.0, "notes": ""},
            {"name": "Castor Oil",               "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 72,   "percentage": None, "notes": "5% superfat"},
            {"name": "Aloe Vera Juice",          "amount_grams": 180,  "percentage": None, "notes": "Pure aloe, replaces all water"},
            {"name": "Sodium Lactate",           "amount_grams": 5,    "percentage": None, "notes": "Aids unmoulding — aloe bars can be soft"},
            {"name": "Lavender Essential Oil",   "amount_grams": 12,   "percentage": None, "notes": "Optional"},
        ],
        "steps": [
            {"instruction": "Freeze the aloe vera juice into cubes (like the goat milk method). This prevents the sugars in aloe from scorching when lye is added.", "duration_minutes": 5},
            {"instruction": "Slowly add NaOH to the frozen aloe cubes in an ice bath, stirring constantly. Keep temperatures below 27°C. The solution may turn slightly orange/yellow — this is normal.", "duration_minutes": 20},
            {"instruction": "Add sodium lactate to the cooled lye-aloe mixture.", "duration_minutes": 2},
            {"instruction": "Melt coconut oil and shea butter. Combine with olive and castor oils at 30°C.", "duration_minutes": 10},
            {"instruction": "Pour lye-aloe solution into oils and blend to a light trace.", "duration_minutes": 5},
            {"instruction": "Add lavender EO if using. Pour into mould. Aloe bars can overheat — leave uncovered or very lightly covered, away from drafts.", "duration_minutes": 5},
            {"instruction": "Unmould after 48 hours (aloe bars are soft longer). Slice and cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 13 ───────────────────────────────────────────────────────────────────
    {
        "name": "Mango & Cocoa Luxury Bar",
        "image_url": "/media/recipe-images/mango-cocoa-luxury-bar.jpg",
        "description": (
            "A decadent combination of mango butter and cocoa butter creates a bar "
            "that is exceptionally hard, slow to dissolve, and wonderfully moisturising. "
            "Both butters are solid at room temperature, giving this bar excellent "
            "shelf stability. The subtle natural scents of the butters give it an "
            "elegant, barely-there fragrance that suits all skin types."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["mango-butter", "cocoa-butter", "luxury", "hard-bar", "moisturising"],
        "average_rating": 4.5,
        "rating_count": 18,
        "ingredients": [
            {"name": "Olive Oil",               "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Coconut Oil (76°)",        "amount_grams": 150,  "percentage": 30.0, "notes": ""},
            {"name": "Mango Butter",             "amount_grams": 100,  "percentage": 20.0, "notes": "Deodorised"},
            {"name": "Cocoa Butter",             "amount_grams": 50,   "percentage": 10.0, "notes": ""},
            {"name": "Castor Oil",               "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 72,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",          "amount_grams": 180,  "percentage": None, "notes": ""},
        ],
        "steps": [
            {"instruction": "Melt mango butter and cocoa butter together gently — both have higher melting points. Avoid overheating.", "duration_minutes": 10},
            {"instruction": "Dissolve NaOH in water. Cool to 43°C — butter soaps do well at a slightly higher temperature.", "duration_minutes": 15},
            {"instruction": "Combine melted butters with olive and castor oils at 43°C.", "duration_minutes": 5},
            {"instruction": "Blend lye and oils. Be aware that high butter percentages can cause trace to come on quickly — blend in short bursts.", "duration_minutes": 5},
            {"instruction": "Pour at a medium trace into a lined mould. Cover and insulate fully for 24 hours.", "duration_minutes": 5},
            {"instruction": "Unmould and slice. Bars will be exceptionally hard. Cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 14 ───────────────────────────────────────────────────────────────────
    {
        "name": "Spirulina & Hemp Earth Bar",
        "image_url": "/media/recipe-images/spirulina-hemp-earth-bar.jpg",
        "description": (
            "An earthy, naturally green bar coloured with spirulina powder and "
            "enriched with hemp seed oil. Spirulina is a micro-algae packed with "
            "antioxidants, amino acids, and vitamins. Hemp seed oil brings its "
            "celebrated balance of omega fatty acids. Together they create a bar "
            "that looks stunning and is packed with skin-beneficial properties."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.ADVANCED,
        "cure_time_days": 35,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["spirulina", "hemp", "natural-color", "antioxidant", "vegan"],
        "average_rating": 4.3,
        "rating_count": 12,
        "ingredients": [
            {"name": "Olive Oil",               "amount_grams": 200,  "percentage": 40.0, "notes": ""},
            {"name": "Coconut Oil (76°)",        "amount_grams": 150,  "percentage": 30.0, "notes": ""},
            {"name": "Hemp Seed Oil",            "amount_grams": 75,   "percentage": 15.0, "notes": "Added at trace"},
            {"name": "Shea Butter",              "amount_grams": 50,   "percentage": 10.0, "notes": ""},
            {"name": "Castor Oil",               "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 71,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",          "amount_grams": 178,  "percentage": None, "notes": ""},
            {"name": "Spirulina Powder",         "amount_grams": 5,    "percentage": None, "notes": "1 tsp per 500g oils, dissolved in a little oil"},
        ],
        "steps": [
            {"instruction": "Mix spirulina powder into 1 tablespoon of olive oil from your weighed batch until a smooth paste forms. Set aside.", "duration_minutes": 5},
            {"instruction": "Set aside the hemp seed oil — it will be added at trace to protect it from heat.", "duration_minutes": 2},
            {"instruction": "Dissolve NaOH in water. Cool to 35°C.", "duration_minutes": 15},
            {"instruction": "Melt coconut oil and shea butter. Combine with remaining olive and castor oils at 35°C.", "duration_minutes": 10},
            {"instruction": "Blend lye and oils to a light trace.", "duration_minutes": 5},
            {"instruction": "Add hemp seed oil, then the spirulina paste. Stir thoroughly by hand — the batter will turn a beautiful deep green.", "duration_minutes": 5},
            {"instruction": "Pour into mould. Cover without insulating (to prevent colour change from excess heat). Cure for 35 days. Note: spirulina colour may fade slightly over a long cure — this is natural.", "duration_minutes": 5},
        ],
    },
    # ── 15 ───────────────────────────────────────────────────────────────────
    {
        "name": "Tallow & Lard Heritage Bar",
        "image_url": "/media/recipe-images/tallow-lard-heritage-bar.jpg",
        "description": (
            "Before vegetable oils became widely available, soap makers relied on "
            "animal tallows and lards to produce firm, long-lasting bars. This "
            "heritage recipe honours that tradition. Tallow and lard produce bars "
            "with outstanding hardness, mild cleansing, and a luxuriously creamy "
            "lather that many find superior to all-vegetable soaps."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.BEGINNER,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["tallow", "lard", "heritage", "traditional", "long-lasting"],
        "average_rating": 4.4,
        "rating_count": 16,
        "ingredients": [
            {"name": "Tallow (Beef)",           "amount_grams": 200,  "percentage": 40.0, "notes": "Rendered beef tallow"},
            {"name": "Lard (Pork)",             "amount_grams": 150,  "percentage": 30.0, "notes": "Leaf lard preferred"},
            {"name": "Coconut Oil (76°)",        "amount_grams": 100,  "percentage": 20.0, "notes": "For lather"},
            {"name": "Castor Oil",              "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Olive Oil",               "amount_grams": 25,   "percentage": 5.0,  "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)", "amount_grams": 71,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",         "amount_grams": 178,  "percentage": None, "notes": ""},
        ],
        "steps": [
            {"instruction": "Melt tallow and lard together over gentle heat. They are solid at room temperature. Add coconut oil and allow to melt fully.", "duration_minutes": 15},
            {"instruction": "Dissolve NaOH in water. Cool to 43°C — animal fat soaps work well at slightly higher temperatures.", "duration_minutes": 15},
            {"instruction": "Combine all oils at 43°C. Add olive and castor oils to the melted fats.", "duration_minutes": 5},
            {"instruction": "Pour lye solution into oils. Blend to a medium trace — animal fat soaps often reach trace very quickly.", "duration_minutes": 5},
            {"instruction": "Pour into mould. Cover and insulate for 24 hours. These bars gel easily and benefit from a full gel phase.", "duration_minutes": 3},
            {"instruction": "Unmould after 24 hours — the bars will be very firm. Slice and cure for 28 days minimum; 6 weeks is even better.", "duration_minutes": 10},
        ],
    },
    # ── 16 ───────────────────────────────────────────────────────────────────
    {
        "name": "Coconut Milk Lather Bar",
        "image_url": "/media/recipe-images/coconut-milk-lather-bar.jpg",
        "description": (
            "Coconut milk replaces water in this ultra-creamy bar, lending its "
            "natural fats, proteins, and vitamin E to produce a truly luxurious "
            "lather. The bar has a warm, creamy ivory colour and a naturally sweet "
            "coconut fragrance that needs no added perfume. Excellent as a shampoo "
            "bar for dry or colour-treated hair."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["coconut-milk", "shampoo-bar", "creamy", "hair-care", "lather"],
        "average_rating": 4.6,
        "rating_count": 31,
        "ingredients": [
            {"name": "Coconut Oil (76°)",        "amount_grams": 225,  "percentage": 45.0, "notes": "High coconut for a shampoo bar"},
            {"name": "Olive Oil",                "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Castor Oil",               "amount_grams": 75,   "percentage": 15.0, "notes": "High castor improves lather for hair use"},
            {"name": "Argan Oil",                "amount_grams": 25,   "percentage": 5.0,  "notes": "Added as superfat at trace"},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 76,   "percentage": None, "notes": "5% superfat"},
            {"name": "Coconut Milk",             "amount_grams": 180,  "percentage": None, "notes": "Full-fat, frozen into cubes"},
        ],
        "steps": [
            {"instruction": "Freeze coconut milk into cubes the night before.", "duration_minutes": 5},
            {"instruction": "Slowly sprinkle NaOH over frozen coconut milk cubes in an ice bath, stirring constantly. The milk sugars will cause the mixture to heat and turn golden — keep it cool.", "duration_minutes": 20},
            {"instruction": "Allow the lye-coconut milk mixture to cool to around 27°C.", "duration_minutes": 10},
            {"instruction": "Melt coconut oil and combine with olive and castor oils. Set argan oil aside.", "duration_minutes": 10},
            {"instruction": "Bring oils to about 27°C (matching lye temp). Pour lye mixture into oils and blend to a light trace.", "duration_minutes": 5},
            {"instruction": "Stir in argan oil by hand at trace. Pour into mould. Do not insulate — milk soaps can volcano if they get too hot.", "duration_minutes": 5},
            {"instruction": "Unmould after 48 hours and cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 17 ───────────────────────────────────────────────────────────────────
    {
        "name": "Kaolin Clay & Rose Bar",
        "image_url": "/media/recipe-images/kaolin-clay-rose-bar.jpg",
        "description": (
            "Kaolin clay adds a silky, velvety slip to this elegantly pink bar. "
            "Clay particles gently absorb excess oils from the skin's surface, making "
            "this bar ideal for combination and normal skin types. The argan oil "
            "superfat adds a luxurious finishing touch, making this a popular bar "
            "for weddings and gift sets."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["kaolin-clay", "rose", "silky", "gift", "combination-skin"],
        "average_rating": 4.7,
        "rating_count": 28,
        "ingredients": [
            {"name": "Olive Oil",               "amount_grams": 225,  "percentage": 45.0, "notes": ""},
            {"name": "Coconut Oil (76°)",        "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Shea Butter",              "amount_grams": 75,   "percentage": 15.0, "notes": ""},
            {"name": "Argan Oil",                "amount_grams": 25,   "percentage": 5.0,  "notes": "Superfat — added at trace"},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 72,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",          "amount_grams": 180,  "percentage": None, "notes": ""},
            {"name": "Kaolin Clay",              "amount_grams": 5,    "percentage": None, "notes": "Mix with 1 tbsp water before adding"},
            {"name": "Mica Powder",              "amount_grams": 3,    "percentage": None, "notes": "Pink or rose mica"},
        ],
        "steps": [
            {"instruction": "Mix kaolin clay with 1 tablespoon of distilled water to form a smooth slurry. Mix mica powder with a drop of oil. Set both aside.", "duration_minutes": 5},
            {"instruction": "Dissolve NaOH in water. Cool to 38°C.", "duration_minutes": 15},
            {"instruction": "Melt coconut oil and shea butter. Combine with olive oil. Set argan oil aside.", "duration_minutes": 10},
            {"instruction": "Blend lye and oils to a light trace.", "duration_minutes": 5},
            {"instruction": "At light trace, add argan oil, kaolin clay slurry, and mica powder. Mix by hand thoroughly.", "duration_minutes": 5},
            {"instruction": "Pour into mould. Cover and insulate for 24 hours.", "duration_minutes": 3},
            {"instruction": "Unmould and slice. Bars will have a beautiful rosy hue. Cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 18 ───────────────────────────────────────────────────────────────────
    {
        "name": "Melt & Pour Glycerin Clear Bar",
        "image_url": "/media/recipe-images/melt-pour-glycerin-clear-bar.jpg",
        "description": (
            "Melt-and-pour soap making is the perfect entry point for beginners and "
            "younger crafters. No lye handling required — just melt the pre-made "
            "base, add colour and fragrance, and pour. This recipe makes a beautiful "
            "transparent glycerin bar. Embed dried lavender buds or flower petals "
            "for a stunning effect."
        ),
        "method": Recipe.Method.MELT_AND_POUR,
        "difficulty": Recipe.Difficulty.BEGINNER,
        "cure_time_days": 1,
        "batch_size_grams": 500,
        "yield_bars": 6,
        "tags": ["melt-and-pour", "beginner", "glycerin", "clear", "craft"],
        "average_rating": 4.1,
        "rating_count": 44,
        "ingredients": [
            {"name": "Distilled Water",          "amount_grams": 10,   "percentage": None, "notes": "A few drops if base gets too thick"},
            {"name": "Lavender Essential Oil",   "amount_grams": 8,    "percentage": None, "notes": "1.5% of base weight"},
            {"name": "Mica Powder",              "amount_grams": 2,    "percentage": None, "notes": "Optional — for colour"},
        ],
        "steps": [
            {"instruction": "Cut the melt-and-pour glycerin base (available from craft suppliers) into 2cm cubes — this helps it melt evenly.", "duration_minutes": 5},
            {"instruction": "Melt the cubes in a heat-safe jug in the microwave in 30-second bursts, stirring between each. Do not boil — stop when just melted. Alternatively, use a double boiler.", "duration_minutes": 10},
            {"instruction": "Allow the melted base to cool slightly to about 60°C. If using mica, mix it with a few drops of rubbing alcohol and stir into the base.", "duration_minutes": 5},
            {"instruction": "Add lavender essential oil and stir gently. Avoid creating bubbles.", "duration_minutes": 3},
            {"instruction": "Spritz soap moulds with rubbing alcohol to prevent soda ash. Pour the base slowly into prepared moulds.", "duration_minutes": 5},
            {"instruction": "Spritz the top surface with rubbing alcohol immediately to pop any surface bubbles. Allow to cool and harden completely — about 1 hour at room temperature or 15 minutes in the fridge.", "duration_minutes": 60},
            {"instruction": "Pop out of moulds. Melt-and-pour bars are ready to use immediately — no cure required. Wrap in cling film to prevent sweating.", "duration_minutes": 5},
        ],
    },
    # ── 19 ───────────────────────────────────────────────────────────────────
    {
        "name": "Sweet Almond & Rice Bran Silk Bar",
        "image_url": "/media/recipe-images/sweet-almond-rice-bran-silk-bar.jpg",
        "description": (
            "Sweet almond oil and rice bran oil are both celebrated for their "
            "skin-softening and anti-aging properties. This delicate bar is light, "
            "non-greasy, and particularly popular with those who find heavier butter "
            "bars too rich. The addition of a small amount of sodium lactate ensures "
            "a clean unmould and a smooth cut surface."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.INTERMEDIATE,
        "cure_time_days": 28,
        "batch_size_grams": 500,
        "yield_bars": 8,
        "tags": ["sweet-almond", "rice-bran", "light", "anti-aging", "silk"],
        "average_rating": 4.5,
        "rating_count": 21,
        "ingredients": [
            {"name": "Sweet Almond Oil",         "amount_grams": 175,  "percentage": 35.0, "notes": ""},
            {"name": "Rice Bran Oil",            "amount_grams": 150,  "percentage": 30.0, "notes": ""},
            {"name": "Coconut Oil (76°)",         "amount_grams": 125,  "percentage": 25.0, "notes": ""},
            {"name": "Castor Oil",               "amount_grams": 50,   "percentage": 10.0, "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)",  "amount_grams": 70,   "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",          "amount_grams": 175,  "percentage": None, "notes": ""},
            {"name": "Sodium Lactate",           "amount_grams": 5,    "percentage": None, "notes": "Promotes a firm bar and clean unmould"},
            {"name": "Lavender Essential Oil",   "amount_grams": 10,   "percentage": None, "notes": "Or unscented"},
        ],
        "steps": [
            {"instruction": "Weigh all ingredients. Sodium lactate will be added to the cooled lye solution.", "duration_minutes": 5},
            {"instruction": "Dissolve NaOH in water. Once clear and below 43°C, stir in sodium lactate.", "duration_minutes": 15},
            {"instruction": "Gently warm coconut oil until melted. Combine all oils at around 35°C.", "duration_minutes": 10},
            {"instruction": "Pour lye solution into oils, blending to a light trace. These liquid oils trace more slowly — be patient.", "duration_minutes": 10},
            {"instruction": "Add lavender EO at light trace, stir by hand to incorporate.", "duration_minutes": 3},
            {"instruction": "Pour into mould, cover and insulate. These bars benefit from a full gel phase.", "duration_minutes": 3},
            {"instruction": "Unmould after 24 hours (sodium lactate helps firm them up). Slice and cure for 28 days.", "duration_minutes": 10},
        ],
    },
    # ── 20 ───────────────────────────────────────────────────────────────────
    {
        "name": "Sunflower & Canola Economical Bar",
        "image_url": "/media/recipe-images/sunflower-canola-economical-bar.jpg",
        "description": (
            "Proof that excellent soap doesn't require expensive ingredients. "
            "Sunflower and canola oils are both readily available, affordable, and "
            "produce a genuinely conditioning bar. This is a great everyday recipe "
            "for making large batches, and a fantastic first recipe for anyone new "
            "to cold-process soap making on a budget."
        ),
        "method": Recipe.Method.COLD_PROCESS,
        "difficulty": Recipe.Difficulty.BEGINNER,
        "cure_time_days": 28,
        "batch_size_grams": 1000,
        "yield_bars": 16,
        "tags": ["budget", "beginner", "everyday", "large-batch", "vegan"],
        "average_rating": 4.2,
        "rating_count": 37,
        "ingredients": [
            {"name": "Canola Oil",              "amount_grams": 400,  "percentage": 40.0, "notes": ""},
            {"name": "Coconut Oil (76°)",        "amount_grams": 300,  "percentage": 30.0, "notes": ""},
            {"name": "Sunflower Oil",            "amount_grams": 200,  "percentage": 20.0, "notes": "High oleic preferred"},
            {"name": "Castor Oil",              "amount_grams": 100,  "percentage": 10.0, "notes": ""},
            {"name": "Sodium Hydroxide (NaOH)", "amount_grams": 142,  "percentage": None, "notes": "5% superfat"},
            {"name": "Distilled Water",         "amount_grams": 355,  "percentage": None, "notes": ""},
            {"name": "Lavender Essential Oil",  "amount_grams": 30,   "percentage": None, "notes": "3% of oil weight — optional"},
        ],
        "steps": [
            {"instruction": "This is a large batch — ensure your equipment is large enough. Melt coconut oil and combine with canola, sunflower, and castor oils.", "duration_minutes": 10},
            {"instruction": "Dissolve NaOH in water with full PPE. For large batches, take extra care pouring the lye.", "duration_minutes": 15},
            {"instruction": "When both are at 38–43°C, slowly pour lye into oils, stick-blending in controlled bursts.", "duration_minutes": 10},
            {"instruction": "Blend to a medium trace. Add lavender EO if using, and stir in by hand.", "duration_minutes": 5},
            {"instruction": "Pour into a large lined mould (a wooden log mould or a cardboard milk carton works well). Cover and insulate for 24 hours.", "duration_minutes": 5},
            {"instruction": "Unmould and cut into 16 bars. Cure for 28 days on a rack. Large batches cure more slowly — ensure good air circulation.", "duration_minutes": 15},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the database with 20 authentic handcrafted soap recipes (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-ingredients",
            action="store_true",
            help="Also run seed_ingredients before seeding recipes.",
        )
        parser.add_argument(
            "--author-email",
            type=str,
            default="",
            help="Email of an existing user to set as recipe author. Defaults to the first superuser found, or creates a seed user.",
        )

    def handle(self, *args, **options):
        if options["with_ingredients"]:
            self.stdout.write("Running seed_ingredients first…")
            call_command("seed_ingredients")

        author = self._get_or_create_author(options["author_email"])
        self.stdout.write(f"Using author: {author.email}")

        created = 0
        updated = 0

        for data in RECIPES:
            # ── Tags ─────────────────────────────────────────────────────────
            tag_objs = []
            for tag_name in data.get("tags", []):
                tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
                tag_objs.append(tag_obj)

            # ── Recipe ───────────────────────────────────────────────────────
            recipe, recipe_created = Recipe.objects.update_or_create(
                name=data["name"],
                defaults={
                    "author": author,
                    "description": data["description"],
                    "method": data["method"],
                    "difficulty": data["difficulty"],
                    "cure_time_days": data["cure_time_days"],
                    "batch_size_grams": data["batch_size_grams"],
                    "yield_bars": data["yield_bars"],
                    "image_url": data.get("image_url", ""),
                    "is_published": True,
                    "average_rating": data.get("average_rating", 0.0),
                    "rating_count": data.get("rating_count", 0),
                },
            )
            recipe.tags.set(tag_objs)

            # ── Ingredients ──────────────────────────────────────────────────
            # Clear existing links so the seed is idempotent on re-runs
            recipe.recipe_ingredients.all().delete()
            for ing_data in data.get("ingredients", []):
                try:
                    ingredient = Ingredient.objects.get(name=ing_data["name"])
                except Ingredient.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  Skipping ingredient '{ing_data['name']}' — not found. "
                            "Run seed_ingredients first."
                        )
                    )
                    continue
                RecipeIngredient.objects.create(
                    recipe=recipe,
                    ingredient=ingredient,
                    amount_grams=ing_data["amount_grams"],
                    percentage=ing_data.get("percentage"),
                    notes=ing_data.get("notes", ""),
                )

            # ── Steps ────────────────────────────────────────────────────────
            recipe.steps.all().delete()
            for order, step_data in enumerate(data.get("steps", []), start=1):
                Step.objects.create(
                    recipe=recipe,
                    order=order,
                    instruction=step_data["instruction"],
                    duration_minutes=step_data.get("duration_minutes"),
                )

            if recipe_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone! {created} recipes created, {updated} updated. "
                f"Total published recipes in DB: {Recipe.objects.filter(is_published=True).count()}"
            )
        )

    def _get_or_create_author(self, email: str):
        """Return the requested user, the first superuser, or create a seed account."""
        if email:
            try:
                return User.objects.get(email=email)
            except User.DoesNotExist:
                raise CommandError(f"No user found with email '{email}'.")

        # Fall back to first superuser
        superuser = User.objects.filter(is_superuser=True).order_by("date_joined").first()
        if superuser:
            return superuser

        # Create a dedicated seed author if no superuser exists
        seed_email = "seed@thesoapmaker.com"
        user, created = User.objects.get_or_create(
            email=seed_email,
            defaults={
                "is_staff": True,
                "display_name": "The Soap Maker",
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
            self.stdout.write(f"  Created seed author: {seed_email}")
        return user
