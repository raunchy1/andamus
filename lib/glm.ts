const GLM_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

export async function glmChat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  model = "glm-z1"
): Promise<string> {
  const res = await fetch(`${GLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GLM error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}
