export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  return res.status(200).send(
    JSON.stringify(
      {
        success: true,
        message: 'HeroSlide API is working',
        usage: [
          '/api/heroslide/blue-lock',
          '/api/heroslide/one-piece',
          '/api/heroslide/naruto'
        ]
      },
      null,
      2
    )
  );
}
