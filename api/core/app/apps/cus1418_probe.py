"""Temporary CUS-1418 diagnostic probes. NOT FOR MERGE.

The failure being chased is a chat request that returns 200 with an empty
answer and never completes: the generate-worker greenlet is created and
``start()`` returns, but its body never executes.

Such a request produces no usable trace, because a span that never ends is
never exported. So each probe emits a span that **ends immediately** -- every
stage the request actually reached gets exported, and the gap after the last
marker is where it hung. The log line is kept as well so the same evidence is
available without depending on the trace pipeline.
"""

import logging

from opentelemetry.trace import get_tracer

logger = logging.getLogger(__name__)

_tracer = get_tracer("cus1418")


def mark(stage: str, message_id: str, **attrs: object) -> None:
    """Record one probe point as both a log line and a zero-length span."""
    if attrs:
        extra = " ".join(f"{k}={v}" for k, v in attrs.items())
        logger.info("CUS1418 %s message_id=%s %s", stage, message_id, extra)
    else:
        logger.info("CUS1418 %s message_id=%s", stage, message_id)

    # start_as_current_span picks up the ambient context, so the marker joins
    # the request's own trace; ending it here is what makes it exportable.
    with _tracer.start_as_current_span(f"CUS1418.{stage}") as span:
        span.set_attribute("cus1418.stage", stage)
        span.set_attribute("cus1418.message_id", message_id)
        for key, value in attrs.items():
            span.set_attribute(f"cus1418.{key}", str(value))
