export default async function handler(req, res) {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;

    if (!token || !userId) {
      return res.status(500).json({
        error: "Missing Instagram environment variables.",
      });
    }

    const fields =
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

    const url = `https://graph.facebook.com/v20.0/${userId}/media?fields=${fields}&limit=8&access_token=${token}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Instagram API request failed.",
        details: data,
      });
    }

    const posts = data.data.map((post) => ({
      id: post.id,
      caption: post.caption || "",
      mediaType: post.media_type,
      image:
        post.media_type === "VIDEO"
          ? post.thumbnail_url
          : post.media_url,
      link: post.permalink,
      timestamp: post.timestamp,
    }));

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({
      error: "Something went wrong fetching Instagram posts.",
      details: error.message,
    });
  }
}