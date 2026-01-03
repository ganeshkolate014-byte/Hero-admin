import { uploadToCloudinary, getCloudConfig } from './cloudinaryService';
import { SlideData, MasterDB } from '../types';

// The specific master database file ID
const MASTER_DB_PUBLIC_ID = 'userinfo.json';

const fetchMasterDB = async (): Promise<MasterDB> => {
  const { cloudName } = getCloudConfig();
  if (!cloudName) return { users: {} };

  // Cache-busting is crucial here to get the latest DB state
  const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${MASTER_DB_PUBLIC_ID}?_=${Date.now()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.log("Master DB not found, initializing new.");
        return { users: {} };
      }
      throw new Error(`Failed to fetch master DB: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return (data && data.users) ? (data as MasterDB) : { users: {} };
  } catch (error) {
    console.warn("Error loading master DB (returning empty):", error);
    return { users: {} };
  }
};

export const getUserLibrary = async (username: string): Promise<SlideData[]> => {
  try {
    const db = await fetchMasterDB();
    const userData = db.users[username];
    if (userData && Array.isArray(userData.library)) {
      return userData.library.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }
    return [];
  } catch (error) {
    console.error("Error getting user library:", error);
    return [];
  }
};

export const saveUserLibrary = async (username: string, slides: SlideData[]): Promise<void> => {
  try {
    const { cloudName } = getCloudConfig();
    if (!cloudName) throw new Error("Cloudinary not configured");

    // 1. Fetch latest DB state to minimize race conditions
    // We replicate fetch logic here to handle errors more strictly during write
    const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${MASTER_DB_PUBLIC_ID}?_=${Date.now()}`;
    let db: MasterDB = { users: {} };
    
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data && data.users) {
                db = data;
            }
        } else if (response.status !== 404) {
            // Critical: If fetch fails with something other than 404, do not overwrite!
            throw new Error(`Cannot verify existing DB status: ${response.status}`);
        }
    } catch (err) {
        console.error("Pre-save fetch failed:", err);
        throw err; // Stop saving to protect integrity
    }

    // 2. Update specific user data with explicit User Info preservation
    const currentInfo = db.users[username]?.info;
    const now = new Date().toISOString();

    db.users[username] = {
      info: {
        username: username,
        joinedAt: currentInfo?.joinedAt || now,
        lastActive: now
      },
      library: slides,
      lastUpdated: now
    };

    // 3. Save back to Cloudinary
    const jsonString = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // We use the specific filename provided
    const file = new File([blob], MASTER_DB_PUBLIC_ID, { type: 'application/json' });

    await uploadToCloudinary(file, {
      publicId: MASTER_DB_PUBLIC_ID
    });
    
  } catch (error) {
    console.error('Failed to save library to Cloudinary:', error);
    throw error;
  }
};