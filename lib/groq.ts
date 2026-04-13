const TOPIC_GUIDE_MODEL = "llama3-70b-8192"

export async function generateTopicGuide(courseLabel: string, topicId: string): Promise<string> {
  const response = await fetch("/api/resources/guide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      courseLabel,
      topicId,
      model: TOPIC_GUIDE_MODEL,
    }),
  })

  if (!response.ok) {
    throw new Error("Could not generate a topic guide right now.")
  }

  const data = (await response.json()) as { feedback: string }
  return data.feedback
}

export { TOPIC_GUIDE_MODEL }

