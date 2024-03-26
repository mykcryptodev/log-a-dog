import { type NextApiRequest, type NextApiResponse } from 'next';

export default async function deleteCookies(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  res.setHeader('Set-Cookie', [
    `logDogXyz=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`,
    `logDogUser=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`
  ]);

  return res.status(200).json({ message: 'Cookies deleted successfully' });
}
