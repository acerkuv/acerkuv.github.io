export async function readJSON(url) {
  const res = await fetch(url);
  return await res.json();
}
