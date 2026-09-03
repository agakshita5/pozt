from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

MAX_INPUT_CHARS = 15_000
MAX_REGENS = 3

Platform = Literal["x", "instagram", "linkedin", "reddit"]
Tone = Literal["professional", "casual", "punchy", "technical"]

PLATFORMS: tuple[Platform, ...] = ("x", "instagram", "linkedin", "reddit")

class XPost(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tweets: list[str] = Field(
        description="The thread, in order. Each tweet at most 280 characters, "
        "no leading numbering like '1/'."
    )
    hashtags: list[str] = Field(
        description="2-4 hashtags without the # sign, appended to the last tweet."
    )

class InstagramPost(BaseModel):
    model_config = ConfigDict(extra="forbid")

    caption: str = Field(
        description="Caption of at most 2200 characters. First line is the hook."
    )
    hashtags: list[str] = Field(
        description="10-20 hashtags without the # sign."
    )

class LinkedInPost(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(
        description="Post body of at most 3000 characters. Opens with a one-line "
        "hook, then short paragraphs separated by blank lines."
    )
    hashtags: list[str] = Field(
        description="3-5 hashtags without the # sign."
    )

class RedditPost(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(description="Post title, at most 300 characters.")
    body: str = Field(description="Self-post body in Markdown.")
    suggested_subreddits: list[str] = Field(
        description="2-4 subreddit names without the 'r/' prefix."
    )

class Bundle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    x: XPost
    instagram: InstagramPost
    linkedin: LinkedInPost
    reddit: RedditPost

PLATFORM_MODEL: dict[str, type[BaseModel]] = {
    "x": XPost,
    "instagram": InstagramPost,
    "linkedin": LinkedInPost,
    "reddit": RedditPost,
}

class GenerateRequest(BaseModel):
    source_type: Literal["url", "text"]
    source: str
    tone: Tone = "professional"

class RegenerateRequest(BaseModel):
    platform: Platform
    tone: Tone

class Post(BaseModel):
    platform: Platform
    tone: Tone
    payload: dict
    over_limit: list[str] = Field(
        default_factory=list,
        description="Names of fields that exceeded the platform's character limit.",
    )
    regens_remaining: int

class RunSummary(BaseModel):
    id: str
    title: str
    source_type: str
    tone: Tone
    created_at: str

class Run(RunSummary):
    source: str
    extracted_text: str
    truncated: bool = False
    posts_by_tone: dict[str, dict[str, Post]]
