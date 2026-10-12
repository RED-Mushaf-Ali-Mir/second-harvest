"""Open food intake and optional reference facts; food names are never enums."""
import re
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

FDA = (
    "https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/"
    "nutrition-information-raw-vegetables"
)
SCRAPS = (
    "https://yardandgarden.extension.iastate.edu/how-to/"
    "how-grow-vegetables-kitchen-scraps-avocados-pineapples-"
    "green-onions-and-more"
)
TOMATO = (
    "https://www.extension.umd.edu/resource/growing-tomatoes-home-garden"
)
SEEDS = (
    "https://extension.umd.edu/resource/vegetables-not-true-type"
)
CONTAINERS = (
    "https://www.extension.umd.edu/resource/"
    "growing-vegetables-containers-and-salad-tables"
)

NUTRIENTS = {
    "Vitamin C": {
        "role": (
            "Helps your body make collagen and absorb iron from plant foods."
        ),
        "source": "https://ods.od.nih.gov/factsheets/VitaminC-Consumer/",
    },
    "Vitamin A": {
        "role": "Supports normal vision and immune function.",
        "source": (
            "https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/"
        ),
    },
    "Potassium": {
        "role": "Helps nerves transmit signals and muscles contract.",
        "source": "https://ods.od.nih.gov/factsheets/Potassium-Consumer/",
    },
}

CATALOGUE = {
    "tomato": {
        "id": "tomato",
        "name": "Tomato",
        "part": "Healthy, uncooked seeds from a ripe tomato",
        "nutrients": ["Vitamin C", "Potassium"],
        "food_note": (
            "Amounts depend on portion, variety, and preparation."
        ),
        "path": "Start a tomato plant from seed",
        "outcome": (
            "A longer project that may eventually produce fruit. "
            "Saved hybrid seeds may not resemble the parent plant."
        ),
        "reason": (
            "Choose this for learning about seeds and a longer growing project."
        ),
        "requirements": [
            "Seed-starting materials and a draining container.",
            "A suitable mature container or garden space.",
            "At least 6 hours of direct sun for outdoor growing.",
            "Warm growing conditions without frost.",
        ],
        "limit": (
            "A small reused bottle is not automatically a suitable final pot."
        ),
        "sources": [TOMATO, SEEDS, CONTAINERS],
        "priority": 40,
        "soil_start": True,
    },
    "spring_onion": {
        "id": "spring_onion",
        "name": "Spring onion",
        "part": "Healthy, uncooked white bases with roots attached",
        "nutrients": ["Vitamin C", "Potassium"],
        "food_note": (
            "Small garnish portions contribute modest nutrient amounts."
        ),
        "path": "Regrow spring onion greens",
        "outcome": (
            "New green shoots from rooted bases; water-only regrowth "
            "eventually uses up the plant's reserves."
        ),
        "reason": (
            "Our first beginner option when rooted bases are available."
        ),
        "requirements": [
            "A clean vessel and fresh water for starting.",
            "A suitable bright location.",
            "A later potting or garden plan for continued growth.",
        ],
        "limit": "Do not expect unlimited harvests from plain water.",
        "sources": [SCRAPS, CONTAINERS],
        "priority": 10,
        "soil_start": False,
    },
    "carrot": {
        "id": "carrot",
        "name": "Carrot",
        "part": "A healthy, uncooked crown with the top of the root attached",
        "nutrients": ["Vitamin A", "Potassium"],
        "food_note": (
            "Orange carrots contain carotenoids the body can convert "
            "to vitamin A."
        ),
        "path": "Observe carrot-top leaf growth",
        "outcome": "Leaves may regrow; this will not produce a new carrot root.",
        "reason": "Choose this as a small observation experiment.",
        "requirements": [
            "An intact crown rather than loose peelings.",
            "A clean shallow vessel, water, and a bright location.",
        ],
        "limit": "This is a leaf-growing experiment, not a replacement carrot.",
        "sources": [SCRAPS],
        "priority": 30,
        "soil_start": False,
    },
    "celery": {
        "id": "celery",
        "name": "Celery",
        "part": "A healthy, uncooked intact basal end of a celery bunch",
        "nutrients": ["Potassium", "Vitamin C"],
        "food_note": (
            "Nutrient amounts depend on the portion and preparation."
        ),
        "path": "Regrow leaves from a celery base",
        "outcome": (
            "The intact base can produce new leaves. "
            "A supermarket-sized bunch is not guaranteed."
        ),
        "reason": "Choose this to watch new growth emerge from a saved base.",
        "requirements": [
            "A clean shallow vessel and water for starting.",
            "A suitable bright location.",
            "Potting mix and a draining container for later transfer.",
        ],
        "limit": "Discard deteriorating material rather than promising regrowth.",
        "sources": [SCRAPS, CONTAINERS],
        "priority": 20,
        "soil_start": False,
    },
}


class FoodItem(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    food: str = Field(min_length=1, max_length=80)
    leftovers: str = Field(min_length=1, max_length=300)
    condition: Literal["raw", "cooked", "spoiled", "none", "unknown"] = "unknown"


class Interpretation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[FoodItem] = Field(max_length=12)


class FoodRequest(BaseModel):
    items: list[FoodItem] = Field(min_length=1, max_length=12)


class GardenRequest(FoodRequest):
    sunlight: Literal["unknown", "low", "medium", "high"] = "unknown"
    materials: Literal["ready", "missing", "unknown"] = "unknown"
    vessel: Literal["yes", "no", "unknown"] = "unknown"
    space: Literal["Balcony", "Garden", "Terrace", "Not sure"] = "Not sure"
    location: str = Field(default="", max_length=100)
    goal: Literal["Easy first experiment", "Grow something edible", "Learn from seeds"] = "Easy first experiment"


class ExplainRequest(GardenRequest):
    selected: int = Field(ge=0, le=11)


def reference_for(name):
    name = name.lower().strip().replace("_", " ")
    aliases = {"tomatoes": "tomato", "carrots": "carrot",
               "green onion": "spring_onion", "green onions": "spring_onion",
               "spring onion": "spring_onion", "spring onions": "spring_onion",
               "scallion": "spring_onion", "scallions": "spring_onion"}
    return CATALOGUE.get(aliases.get(name, name))


def hard_block(item):
    if item.condition in {"cooked", "spoiled", "none"}:
        return {"cooked": "Cooked leftovers are not viable planting material.",
                "spoiled": "Do not plant spoiled or moldy leftovers.",
                "none": "No leftovers are available to plant."}[item.condition]
    # Peel-only leftovers have no growing point, regardless of the food name.
    words = set(re.findall(r"[a-z]+", item.leftovers.lower()))
    if words & {"peel", "peels", "peelings"} and not words & {"seed", "seeds", "root", "roots", "base", "bases", "crown", "stem", "stems", "cutting", "cuttings", "sucker", "corm", "bud", "buds", "eye", "eyes", "node", "nodes"}:
        return "Peel alone cannot grow a new plant."
    return None


def compact_reference(item):
    ref = reference_for(item.food)
    if not ref:
        return None
    return {key: ref[key] for key in ("part", "path", "outcome", "requirements", "limit")}
