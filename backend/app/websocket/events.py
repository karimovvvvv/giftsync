from enum import StrEnum


class WSEventType(StrEnum):
    CONTRIBUTION_ADDED    = "contribution.added"
    CONTRIBUTION_REMOVED  = "contribution.removed"
    HERO_BUYER_ACTIVATED  = "hero_buyer.activated"
    CASCADE_TRANSFERRED   = "cascade.transferred"
    PROGRESS_UPDATED      = "progress.updated"
    CAPSULE_REVEALED      = "capsule.revealed"
    ITEM_LOCKED           = "item.locked"
    ITEM_ADDED            = "item.added"
    ITEM_UPDATED          = "item.updated"
    ITEM_ARCHIVED         = "item.archived"