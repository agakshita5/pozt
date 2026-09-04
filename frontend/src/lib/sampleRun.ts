import type { PostsForTone } from "./types";

const post = (platform: string, payload: Record<string, unknown>) => ({
  platform: platform as never,
  tone: "punchy" as const,
  payload,
  over_limit: [],
  regens_remaining: 3,
});

export const SAMPLE_TITLE = "We measured Kubernetes autoscaling for six months";

export const SAMPLE_POSTS: PostsForTone = {
  x: post("x", {
    tweets: [
      "We ran Kubernetes cluster autoscaling in production for six months and compared it against static node pools.\n\nAutoscaling cost 40% more. Not less. Here is why.",
      "Scale-up latency was the first problem. Nodes took 90 seconds to join. So we kept headroom warm anyway, which is just static provisioning with extra steps.",
      "Anti-affinity rules were the second. One pod per node kept whole machines open long after traffic dropped. The scaler could not reclaim what the scheduler had pinned.",
      "Third was control plane churn. Constant node join and drain generated enough API traffic that we had to size etcd up a tier.",
      "A nightly resize script on static pools beat it on cost and on p99 latency.\n\nIf your load is a sine wave, schedule it. If it is a step function you cannot predict, autoscale it.",
    ],
    hashtags: ["Kubernetes", "DevOps", "CloudCost"],
  }),
  instagram: post("instagram", {
    caption:
      "Six months of production data on Kubernetes autoscaling, and the result surprised us.\n\nAutoscaling cost 40 percent MORE than static node pools.\n\nThree reasons it lost:\n\nScale-up latency meant we kept warm headroom anyway\n\nAnti-affinity rules pinned nodes open long after load dropped\n\nControl plane churn forced us onto a bigger etcd tier\n\nA nightly resize script on static pools won on cost and on p99 latency.\n\nAutoscaling still wins for genuinely spiky traffic. Ours was diurnal and predictable, which is exactly where it loses.\n\nHave you measured yours, or are you trusting the default?",
    hashtags: ["kubernetes", "devops", "platformengineering", "cloudcost", "sre", "infrastructure", "k8s", "finops", "backend", "engineering"],
  }),
  linkedin: post("linkedin", {
    body: "Autoscaling is not automatically cheaper. We have six months of production data that says otherwise.\n\nWe ran Kubernetes cluster autoscaling against statically provisioned node pools and measured both. The autoscaled setup cost 40 percent more.\n\nThree things drove it:\n\nScale-up latency. Nodes took about 90 seconds to become schedulable, so we kept warm headroom regardless. That is static provisioning wearing a costume.\n\nScheduling constraints. Anti-affinity rules held whole nodes open long after the load that justified them had gone. The autoscaler could not reclaim capacity the scheduler had pinned.\n\nControl plane cost. Continuous node join and drain generated enough API traffic to push us onto a larger etcd tier, a line item nobody had forecast.\n\nStatic pools with a nightly resize script beat it on cost and on p99 latency.\n\nNone of this makes autoscaling wrong. It makes it a fit question. Genuinely spiky, unpredictable load is where it earns its keep. Our traffic was diurnal and forecastable, which is precisely the case where a scheduler beats a reactor.\n\nHave you actually measured your autoscaling bill against the static alternative?",
    hashtags: ["Kubernetes", "PlatformEngineering", "FinOps", "SRE"],
  }),
  reddit: post("reddit", {
    title:
      "Six months of data: cluster autoscaling cost us 40% more than static node pools",
    body: "### TL;DR\nWe measured autoscaling against static node pools over six months. Autoscaling cost 40% more and lost on p99 latency. Our traffic is diurnal and predictable, which is the case where it loses.\n\n#### What we measured\n\n1. **Scale-up latency** - nodes took ~90s to become schedulable, so we kept warm headroom anyway. At that point you are paying for static provisioning plus a controller.\n2. **Anti-affinity pinning** - one pod per node kept whole machines open well after load dropped. The autoscaler could not reclaim what the scheduler had pinned.\n3. **Control plane churn** - continuous join and drain generated enough API traffic that we moved to a larger etcd tier. That cost was not in anyone's model.\n\n#### What we switched to\n\nStatic pools with a nightly resize script, sized from the previous week's p95. Cheaper and better tail latency.\n\n#### Caveats\n\nThis is one workload shape. If your traffic is genuinely spiky and unforecastable, autoscaling is the right tool and this result will not transfer. I would push back on the framing that autoscaling is a default rather than a fit decision.\n\nCurious whether anyone has measured this on bursty workloads and seen the opposite.",
    suggested_subreddits: ["kubernetes", "devops", "sre", "ExperiencedDevs"],
  }),
};
