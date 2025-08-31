import json
import pathlib
from typing import Any, Dict, Literal, Optional, TypedDict

from jsonschema import validate

RecordType = Literal["ERC20", "ERC721", "DeFi", "Utility", "Other"]
SourceType = Literal["github", "docs", "blog"]
CairoVersion = Literal["1", "2"]

schema: Dict[str, Any] = {
    "type": "object",
    "required": [
        "contract_name",
        "source",
        "type",
        "cairo_version",
        "last_updated",
        "code",
    ],
    "properties": {
        "contract_name": {"type": "string", "minLength": 1},
        "source": {"type": "string", "enum": ["github", "docs", "blog"]},
        "type": {
            "type": "string",
            "enum": ["ERC20", "ERC721", "DeFi", "Utility", "Other"],
        },
        "cairo_version": {"type": "string", "enum": ["1", "2"]},
        "last_updated": {"type": "string"},
        "quality": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["production", "tutorial", "example", "unknown"],
                },
                "score": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "required": ["category"],
            "additionalProperties": True,
        },
        "repo": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "stars": {"type": "integer", "minimum": 0},
                "forks": {"type": "integer", "minimum": 0},
                "last_commit": {"type": "string"},
                "archived": {"type": "boolean"},
            },
            "additionalProperties": True,
        },
        "code": {"type": "string", "minLength": 1},
    },
    "additionalProperties": True,
}


def test_jsonl_valid():
    p = pathlib.Path("data/processed/dataset.jsonl")
    assert p.exists(), "Run the pipeline to create dataset.jsonl"
    for line in p.read_text().splitlines():
        obj = json.loads(line)
        validate(instance=obj, schema=schema)
