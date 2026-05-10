export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { messages, system } = JSON.parse(event.body);
    if (!process.env.GROQ_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "GROQ_API_KEY not set in Netlify environment variables." }) };
    }
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, headers, body: JSON.stringify({ error: data?.error?.message || "Groq error" }) };
    const reply = data.choices?.[0]?.message?.content || "Unable to process. Please try again.";
    return { statusCode: 200, headers, body: JSON.stringify({ content: [{ type: "text", text: reply }] }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
