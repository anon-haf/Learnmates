const { Dropbox } = require('dropbox');
const formidable = require('formidable-serverless');

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File upload error' });

    const file = files.file;
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN, fetch: fetch });

    const fs = require('fs');
    const fileBuffer = fs.readFileSync(file.path);
    const dropboxPath = `/contributions/${Date.now()}_${file.name}`;
    await dbx.filesUpload({ path: dropboxPath, contents: fileBuffer });
    const shared = await dbx.sharingCreateSharedLinkWithSettings({ path: dropboxPath });

    res.status(200).json({ url: shared.url });
  });
}
