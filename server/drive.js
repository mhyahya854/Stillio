import { google } from "googleapis";

const APP_FOLDER_NAME = "My App Sync";
const SYNC_FILE_NAME = "sync.json";

async function findFolder(drive, folderName) {
  const res = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace("'","\\'")}' and trashed = false`,
    fields: "files(id,name)",
    spaces: "drive",
  });
  return res.data.files && res.data.files.length ? res.data.files[0] : null;
}

export async function ensureAppFolder(oauth2Client) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const found = await findFolder(drive, APP_FOLDER_NAME);
  if (found) return found.id;
  const created = await drive.files.create({
    requestBody: { name: APP_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  return created.data.id;
}

async function findSyncFile(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and name = '${SYNC_FILE_NAME.replace("'","\\'")}' and trashed = false`,
    fields: "files(id,name)",
    spaces: "drive",
  });
  return res.data.files && res.data.files.length ? res.data.files[0] : null;
}

export async function ensureSyncFile(oauth2Client) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const folderId = await ensureAppFolder(oauth2Client);
  const found = await findSyncFile(drive, folderId);
  if (found) return { folderId, fileId: found.id };

  const created = await drive.files.create({
    requestBody: { name: SYNC_FILE_NAME, parents: [folderId], mimeType: "application/json" },
    media: { mimeType: "application/json", body: JSON.stringify({}) },
    fields: "id",
  });
  return { folderId, fileId: created.data.id };
}

export async function loadSyncJson(oauth2Client) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const folderId = await ensureAppFolder(oauth2Client);
  const found = await findSyncFile(drive, folderId);
  if (!found) return null;

  const res = await drive.files.get({ fileId: found.id, alt: "media" }, { responseType: "stream" });
  return new Promise((resolve, reject) => {
    let data = "";
    res.data.on("data", (chunk) => (data += chunk.toString()));
    res.data.on("end", () => {
      try {
        const parsed = JSON.parse(data || "null");
        resolve({ fileId: found.id, data: parsed });
      } catch (err) {
        reject(new Error("invalid_json"));
      }
    });
    res.data.on("error", (err) => reject(err));
  });
}

export async function saveSyncJson(oauth2Client, obj) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const { folderId, fileId } = await ensureSyncFile(oauth2Client);
  const body = JSON.stringify(obj);

  // Use files.update if exists, otherwise create
  if (fileId) {
    await drive.files.update({ fileId, media: { mimeType: "application/json", body } });
    return fileId;
  }

  const created = await drive.files.create({
    requestBody: { name: SYNC_FILE_NAME, parents: [folderId], mimeType: "application/json" },
    media: { mimeType: "application/json", body },
    fields: "id",
  });
  return created.data.id;
}

export async function deleteSyncFile(oauth2Client) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const folderId = await ensureAppFolder(oauth2Client);
  const found = await findSyncFile(drive, folderId);
  if (!found) return false;
  await drive.files.delete({ fileId: found.id });
  return true;
}

export default { ensureAppFolder, ensureSyncFile, loadSyncJson, saveSyncJson, deleteSyncFile };
