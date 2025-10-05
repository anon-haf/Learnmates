const { Dropbox } = require('dropbox');
const formidable = require('formidable-serverless');

module.exports.config = {
  api: { bodyParser: false }
};

module.exports.default = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File upload error' });

    const file = files.file;
    try {
  const dbx = new Dropbox({ accessToken: "sl.u.AGBnCTAJ39AgqC7STfx5Hf9EcKCNwM5QWpCrzn4aMttZFEFMEPL91-o21RPj7dRNrLf3PAagjgoFEUjpk8tkmf7EYC_5jclwe-liLg5ieDNvTj45gztj8D", fetch: fetch });
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(file.path);
      const dropboxPath = `/contributions/${Date.now()}_${file.name}`;
      await dbx.filesUpload({ path: dropboxPath, contents: fileBuffer });
      const shared = await dbx.sharingCreateSharedLinkWithSettings({ path: dropboxPath });
      res.status(200).json({ url: shared.url });
    } catch (error) {
      console.error('Dropbox upload error:', error);
      res.status(500).json({ error: error.message || JSON.stringify(error) || 'Dropbox upload failed' });
    }
  });
}
