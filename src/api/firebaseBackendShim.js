import { auth, db, storage } from "../firebase";
import {
  ref,
  get,
  set,
  update,
  push,
  child,
  remove
} from "firebase/database";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider
} from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

let installed = false;

const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
};

const normalizeUserProfile = (uid, profile = {}, fallbackEmail = "") => {
  const email = profile.email || fallbackEmail || "";
  return {
    id: uid,
    login_id: uid,
    user_id: uid,
    email,
    phone: profile.phone || "",
    account_type: profile.account_type || "user",
    profile_image: profile.profile_image || null,
    name: profile.name || (email ? email.split("@")[0] : "User")
  };
};

const ensureUserProfile = async (firebaseUser, extra = {}) => {
  if (!firebaseUser) return null;
  const userRef = ref(db, `users/${firebaseUser.uid}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    const profile = {
      email: firebaseUser.email || "",
      phone: extra.phone || "",
      account_type: extra.account_type || "user",
      profile_image: extra.profile_image || null,
      name: extra.name || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "User"),
      created_at: new Date().toISOString()
    };
    await set(userRef, profile);
    return normalizeUserProfile(firebaseUser.uid, profile, firebaseUser.email);
  }
  return normalizeUserProfile(firebaseUser.uid, snap.val(), firebaseUser.email);
};

const getCurrentUserProfile = async () => {
  const current = auth.currentUser;
  if (!current) return null;
  const userRef = ref(db, `users/${current.uid}`);
  const snap = await get(userRef);
  const profile = snap.exists() ? snap.val() : {};
  return normalizeUserProfile(current.uid, profile, current.email);
};

const parseBody = (init = {}) => {
  const body = init.body;
  if (!body) return { fields: {}, files: {} };

  if (body instanceof FormData) {
    const fields = {};
    const files = {};
    for (const [key, value] of body.entries()) {
      if (value instanceof File || value instanceof Blob) {
        if (!files[key]) files[key] = [];
        files[key].push(value);
      } else {
        fields[key] = value;
      }
    }
    return { fields, files };
  }

  if (body instanceof URLSearchParams) {
    return { fields: Object.fromEntries(body.entries()), files: {} };
  }

  if (typeof body === "string") {
    try {
      return { fields: JSON.parse(body), files: {} };
    } catch (err) {
      return { fields: Object.fromEntries(new URLSearchParams(body).entries()), files: {} };
    }
  }

  return { fields: {}, files: {} };
};

const uploadFile = async (file, path) => {
  const storagePath = storageRef(storage, path);
  const uploadSnapshot = await uploadBytes(storagePath, file);
  return getDownloadURL(uploadSnapshot.ref);
};

const uploadAttachments = async (files = [], basePath) => {
  if (!files || files.length === 0) return [];
  const uploads = await Promise.all(
    files.map(async (file, index) => {
      const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, "_") : `file_${index}`;
      const url = await uploadFile(file, `${basePath}/${Date.now()}_${safeName}`);
      return {
        path: url,
        name: file.name || safeName,
        type: file.type || "",
        size: file.size || null
      };
    })
  );
  return uploads;
};

const collectList = async (path) => {
  const snap = await get(ref(db, path));
  if (!snap.exists()) return [];
  const value = snap.val();
  return Object.entries(value).map(([id, data]) => ({ id, ...data }));
};

const parseEndpoint = (pathname) => {
  const backendIndex = pathname.indexOf("/backend/");
  if (backendIndex !== -1) {
    return pathname.slice(backendIndex + "/backend/".length);
  }
  const altIndex = pathname.indexOf("/stelsen_monitoring/backend/");
  if (altIndex !== -1) {
    return pathname.slice(altIndex + "/stelsen_monitoring/backend/".length);
  }
  return null;
};

const handleLogin = async (method, body) => {
  if (method === "GET") {
    const profile = await getCurrentUserProfile();
    if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);
    return jsonResponse({ status: "success", user: profile, token: profile.id });
  }

  if (method === "POST") {
    const { email, password } = body;
    if (!email || !password) {
      return jsonResponse({ status: "error", message: "Missing credentials" }, 400);
    }
    const creds = await signInWithEmailAndPassword(auth, email, password);
    const profile = await ensureUserProfile(creds.user);
    return jsonResponse({ status: "success", user: profile, token: profile.id });
  }

  return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
};

const handleRegister = async (method, body) => {
  if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
  const { email, password, phone } = body;
  if (!email || !password) return jsonResponse({ status: "error", message: "Missing fields" }, 400);
  const creds = await createUserWithEmailAndPassword(auth, email, password);
  const profile = await ensureUserProfile(creds.user, { phone });
  try {
    await sendEmailVerification(creds.user);
  } catch (err) {
    // ignore if verification fails
  }
  return jsonResponse({ status: "success", message: "Registration successful. Please verify your email.", user: profile });
};

const handleGoogleLogin = async (method, body) => {
  if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
  const idToken = body?.id_token || body?.credential || body?.idToken;
  if (!idToken) return jsonResponse({ status: "error", message: "Missing Google token" }, 400);
  const credential = GoogleAuthProvider.credential(idToken);
  const creds = await signInWithCredential(auth, credential);
  const profile = await ensureUserProfile(creds.user);
  return jsonResponse({ status: "success", user: profile, token: profile.id });
};

const handleForgotPassword = async (method, body) => {
  if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
  const { action, email } = body;
  if (!email) return jsonResponse({ status: "error", message: "Email required" }, 400);
  if (action === "send_code" || action === "reset_password") {
    await sendPasswordResetEmail(auth, email);
    return jsonResponse({ status: "success", message: "Password reset email sent." });
  }
  return jsonResponse({ status: "success", message: "Verification not required." });
};

const handleVerify = async () => {
  return jsonResponse({ status: "success", message: "Email verification handled via Firebase link." });
};

const handleUsers = async () => {
  const users = await collectList("users");
  const normalized = users.map((u) => normalizeUserProfile(u.id, u, u.email));
  return jsonResponse(normalized);
};

const handleAnnouncements = async (method, body, query) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);

  if (method === "GET") {
    const announcements = await collectList("announcements");
    const readsSnap = await get(ref(db, `announcementReads`));
    const reads = readsSnap.exists() ? readsSnap.val() : {};
    const result = announcements.map((a) => {
      const unread = !(reads?.[a.id]?.[profile.id]);
      return {
        announcement_id: a.id,
        title: a.title,
        content: a.content,
        type: a.type || "general",
        priority: a.priority || "medium",
        author: a.author || "admin",
        created_at: a.created_at || new Date().toISOString(),
        created_at_ts: a.created_at_ts || null,
        is_active: a.is_active ?? 1,
        is_pinned: a.is_pinned ?? 0,
        unread: unread ? 1 : 0
      };
    });
    return jsonResponse(result);
  }

  if (method === "POST") {
    if (body?.action === "pin") {
      const id = body.id;
      const pinned = !!body.pinned;
      if (!id) return jsonResponse({ status: "error", message: "Missing announcement id" }, 400);
      await update(ref(db, `announcements/${id}`), { is_pinned: pinned ? 1 : 0 });
      return jsonResponse({ status: "success" });
    }

    const newRef = push(ref(db, "announcements"));
    const createdAt = new Date().toISOString();
    await set(newRef, {
      title: body.title || "",
      content: body.content || "",
      type: body.type || "general",
      priority: body.priority || "medium",
      created_at: createdAt,
      created_at_ts: Math.floor(Date.now() / 1000),
      created_by: profile.id,
      author: profile.account_type === "admin" ? "Admin" : profile.name,
      is_active: 1,
      is_pinned: 0
    });
    return jsonResponse({ status: "success", message: "Announcement created" });
  }

  return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
};

const handleMarkRead = async (method, body) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);
  if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
  const id = body.announcement_id;
  if (!id) return jsonResponse({ status: "error", message: "Missing announcement ID" }, 400);
  await set(ref(db, `announcementReads/${id}/${profile.id}`), true);
  return jsonResponse({ status: "success", message: "Marked as read" });
};

const handleProjects = async (method, body) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);

  if (method === "GET") {
    const projects = await collectList("projects");
    const filtered = profile.account_type === "admin"
      ? projects
      : projects.filter((p) => Array.isArray(p.assignedUsers) && p.assignedUsers.some((id) => String(id) === String(profile.id)));
    const normalized = filtered.map((p) => ({
      id: p.id,
      project_id: p.id,
      title: p.title || "",
      description: p.description || "",
      status: p.status || "pending",
      progress: p.progress || 0,
      deadline: p.deadline || "",
      manager: p.manager || "",
      budget: p.budget || 0,
      team_users: p.team_users || (Array.isArray(p.assignedUsers) ? p.assignedUsers.length : 0),
      assignedUsers: p.assignedUsers || [],
      assigned_users: p.assignedUsers || [],
      startDate: p.startDate || p.created_at || "",
      created_at: p.created_at || ""
    }));
    return jsonResponse(normalized);
  }

  if (method === "POST") {
    const newRef = push(ref(db, "projects"));
    const createdAt = new Date().toISOString();
    await set(newRef, {
      title: body.title || "",
      description: body.description || "",
      status: body.status || "pending",
      progress: body.progress || 0,
      deadline: body.deadline || "",
      manager: body.manager || "",
      budget: body.budget || 0,
      team_users: body.team_users || (Array.isArray(body.assignedUsers) ? body.assignedUsers.length : 0),
      assignedUsers: body.assignedUsers || [],
      startDate: body.startDate || createdAt,
      created_at: createdAt
    });
    return jsonResponse({ status: "success", message: "Project created", id: newRef.key });
  }

  if (method === "PUT") {
    const id = body.id || body.project_id;
    if (!id) return jsonResponse({ status: "error", message: "Missing project id" }, 400);
    const updateData = { ...body };
    delete updateData.id;
    delete updateData.project_id;
    await update(ref(db, `projects/${id}`), updateData);
    return jsonResponse({ status: "success" });
  }

  return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
};

const handleComments = async (method, body, query, files) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);

  const announcementId = query.get("announcement_id");
  const projectId = query.get("project_id");

  if (method === "GET") {
    if (announcementId) {
      const comments = await collectList(`announcementComments/${announcementId}`);
      const mapped = comments
        .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
        .map((c) => ({
        comment_id: c.id,
        comment: c.comment,
        created_at: c.created_at,
        email: c.email,
        profile_image: c.profile_image
      }));
      return jsonResponse({ status: "success", comments: mapped });
    }

    if (projectId) {
      const comments = await collectList(`comments/${projectId}`);
      const mapped = comments
        .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
        .map((c) => ({
        comment_id: c.id,
        comment: c.comment,
        attachments: c.attachments || null,
        progress_percentage: c.progress_percentage || null,
        progress_status: c.progress_status || null,
        evidence_photo: c.evidence_photo || null,
        location_latitude: c.location_latitude || null,
        location_longitude: c.location_longitude || null,
        location_accuracy: c.location_accuracy || null,
        comment_type: c.comment_type || null,
        progress_id: c.progress_id || null,
        approval_status: c.approval_status || null,
        created_at: c.created_at,
        email: c.email,
        profile_image: c.profile_image,
        account_type: c.account_type || "user",
        user: c.user || (c.account_type === "admin" ? "Admin" : c.email?.split("@")[0])
      }));
      return jsonResponse({ status: "success", comments: mapped });
    }

    return jsonResponse({ status: "error", message: "Missing announcement_id or project_id" }, 400);
  }

  if (method === "POST") {
    if (announcementId || body.announcement_id) {
      const id = announcementId || body.announcement_id;
      const newRef = push(ref(db, `announcementComments/${id}`));
      await set(newRef, {
        comment: body.comment || body.text || "",
        created_at: new Date().toISOString(),
        user_id: profile.id,
        email: profile.email,
        profile_image: profile.profile_image || null
      });
      return jsonResponse({ status: "success", message: "Comment added" });
    }

    const targetProjectId = projectId || body.project_id;
    if (!targetProjectId) return jsonResponse({ status: "error", message: "Missing project_id" }, 400);

    const newRef = push(ref(db, `comments/${targetProjectId}`));
    const attachments = await uploadAttachments(files["attachments[]"] || files.attachments || [], `comments/${targetProjectId}/${newRef.key}`);
    const createdAt = new Date().toISOString();
    await set(newRef, {
      comment: body.text || body.comment || "",
      attachments: attachments.length ? attachments : null,
      created_at: createdAt,
      user_id: profile.id,
      email: profile.email,
      profile_image: profile.profile_image || null,
      account_type: profile.account_type || "user"
    });

    return jsonResponse({
      status: "success",
      message: "Comment added",
      comment_id: newRef.key,
      email: profile.email,
      profile_image: profile.profile_image || null,
      user: profile.account_type === "admin" ? "Admin" : profile.name,
      attachments
    });
  }

  return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
};

const handleProjectProgress = async (method, body, query) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);

  if (method === "GET") {
    const projectId = query.get("project_id");
    if (!projectId) return jsonResponse({ status: "error", message: "Invalid project ID" }, 400);
    const progressList = await collectList(`progress/${projectId}`);
    return jsonResponse({ status: "success", progress: progressList.map((p) => ({
      id: p.id,
      project_id: projectId,
      progress_percentage: p.progress_percentage || 0,
      progress_status: p.progress_status || "In Progress",
      notes: p.notes || "",
      evidence_photo: p.evidence_photo || null,
      location_latitude: p.location_latitude || null,
      location_longitude: p.location_longitude || null,
      location_accuracy: p.location_accuracy || null,
      location_name: p.location_name || "",
      approval_status: p.approval_status || "PENDING",
      created_at: p.created_at || new Date().toISOString(),
      user_id: p.user_id || profile.id,
      user_email: p.user_email || profile.email
    })) });
  }

  if (method === "POST") {
    if (body.action === "review_progress") {
      const progressId = body.progress_id;
      const approvalStatus = body.approval_status || "PENDING";
      if (!progressId) return jsonResponse({ status: "error", message: "Missing progress id" }, 400);

      const progressRef = ref(db, `progressIndex/${progressId}`);
      const indexSnap = await get(progressRef);
      if (!indexSnap.exists()) return jsonResponse({ status: "error", message: "Progress not found" }, 404);
      const { project_id, progress_key } = indexSnap.val();

      await update(ref(db, `progress/${project_id}/${progress_key}`), { approval_status: approvalStatus });
      await update(ref(db, `comments/${project_id}/${progress_key}`), { approval_status: approvalStatus });
      return jsonResponse({ status: "success", message: "Progress reviewed" });
    }

    if (body.action === "update_progress") {
      const projectId = body.project_id;
      if (!projectId) return jsonResponse({ status: "error", message: "Missing project id" }, 400);
      const createdAt = new Date().toISOString();
      const progressRef = push(ref(db, `progress/${projectId}`));

      const progressPayload = {
        progress_percentage: Number(body.progress_percentage || 0),
        progress_status: body.status || "In Progress",
        notes: body.notes || "",
        evidence_photo: body.evidence_photo || null,
        location_latitude: body.location_latitude || null,
        location_longitude: body.location_longitude || null,
        location_accuracy: body.location_accuracy || null,
        location_name: body.location_name || "",
        approval_status: "PENDING",
        created_at: createdAt,
        user_id: profile.id,
        user_email: profile.email
      };

      await set(progressRef, progressPayload);
      await set(ref(db, `progressIndex/${progressRef.key}`), { project_id: projectId, progress_key: progressRef.key });

      await set(ref(db, `comments/${projectId}/${progressRef.key}`), {
        comment: progressPayload.notes || "Progress update",
        comment_type: "progress",
        progress_percentage: progressPayload.progress_percentage,
        progress_status: progressPayload.progress_status,
        evidence_photo: progressPayload.evidence_photo,
        location_latitude: progressPayload.location_latitude,
        location_longitude: progressPayload.location_longitude,
        location_accuracy: progressPayload.location_accuracy,
        location_name: progressPayload.location_name,
        approval_status: progressPayload.approval_status,
        progress_id: progressRef.key,
        created_at: createdAt,
        user_id: profile.id,
        email: profile.email,
        profile_image: profile.profile_image || null,
        account_type: profile.account_type || "user",
        user: profile.account_type === "admin" ? "Admin" : profile.name
      });

      await update(ref(db, `projects/${projectId}`), { progress: progressPayload.progress_percentage });

      return jsonResponse({ status: "success", message: "Progress update submitted successfully! Awaiting admin approval.", progress_id: progressRef.key });
    }
  }

  return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
};

const handleProfile = async (method, body, query, files) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);
  if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);

  // Debug logging
  console.log("handleProfile - body keys:", Object.keys(body));
  console.log("handleProfile - files keys:", files ? Object.keys(files) : "no files");
  console.log("handleProfile - files.profile_image:", files?.profile_image);

  // Handle image upload if provided
  let profileImageUrl = null;

  // Check for file upload FIRST (multipart/form-data)
  if (files && files.profile_image && files.profile_image.length > 0) {
    const imageFile = files.profile_image[0];
    console.log("handleProfile - uploading file:", imageFile.name, imageFile.type, imageFile.size);
    try {
      profileImageUrl = await uploadFile(imageFile, `profile_images/${profile.id}/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
      console.log("handleProfile - upload success, URL:", profileImageUrl);
    } catch (err) {
      console.error("handleProfile - upload failed:", err);
      return jsonResponse({ status: "error", message: "Failed to upload image: " + err.message }, 500);
    }
  }
  // Check if it's a base64 DataURL in body
  else if (body.profile_image && typeof body.profile_image === "string" && body.profile_image.startsWith("data:image")) {
    console.log("handleProfile - processing DataURL");
    try {
      // Convert DataURL to Blob
      const base64String = body.profile_image.split(',')[1];
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/jpeg" });
      profileImageUrl = await uploadFile(blob, `profile_images/${profile.id}/${Date.now()}_profile.jpg`);
      console.log("handleProfile - DataURL upload success, URL:", profileImageUrl);
    } catch (err) {
      console.error("DataURL conversion error:", err);
      return jsonResponse({ status: "error", message: "Failed to process image: " + err.message }, 500);
    }
  }
  // Direct URL (already stored)
  else if (body.profile_image && typeof body.profile_image === "string") {
    console.log("handleProfile - using existing URL");
    profileImageUrl = body.profile_image;
  }

  // Return success if we have a URL to save
  if (profileImageUrl) {
    await update(ref(db, `users/${profile.id}`), { profile_image: profileImageUrl });
    return jsonResponse({ status: "success", success: true, message: "Profile image updated", profile_image: profileImageUrl });
  }

  console.error("handleProfile - No image provided. body:", body, "files:", files);
  return jsonResponse({ status: "error", message: "No image provided" }, 400);
};

const handleUpdateProfile = async (method, body) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);
  if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
  const updateData = { ...body };
  delete updateData.id;
  await update(ref(db, `users/${profile.id}`), updateData);
  return jsonResponse({ status: "success", success: true, message: "Profile updated" });
};

const handleLocation = async (method, body, query) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);

  if (method === "GET") {
    const userId = query.get("user_id");
    if (userId === "all") {
      const locations = await collectList("locations");
      const users = await collectList("users");
      const userMap = new Map(users.map((u) => [u.id, u]));
      const normalized = locations.map((loc) => {
        const userData = userMap.get(loc.id) || {};
        return {
          user_id: loc.id,
          longitude: loc.longitude,
          latitude: loc.latitude,
          accuracy: loc.accuracy || null,
          location_name: loc.location_name || "",
          updated_at: loc.updated_at || "",
          email: userData.email || "",
          profile_image: userData.profile_image || null,
          name: userData.name || (userData.email ? userData.email.split("@")[0] : "User")
        };
      });
      return jsonResponse({ status: "success", locations: normalized });
    }
    return jsonResponse({ status: "error", message: "Missing user_id" }, 400);
  }

  if (method === "POST") {
    const payload = {
      longitude: Number(body.longitude),
      latitude: Number(body.latitude),
      accuracy: body.accuracy ? Number(body.accuracy) : null,
      location_name: body.location_name || "",
      updated_at: new Date().toISOString()
    };
    await set(ref(db, `locations/${profile.id}`), payload);
    return jsonResponse({ status: "success", message: "Location saved" });
  }

  return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
};

const handleSubscriptions = async (endpoint, method, body) => {
  const profile = await getCurrentUserProfile();
  if (!profile) return jsonResponse({ status: "error", message: "Unauthorized" }, 401);

  if (endpoint === "list_subscriptions.php") {
    const subs = await collectList(`subscriptions/${profile.id}`);
    return jsonResponse(subs);
  }

  if (endpoint === "save_subscription.php") {
    if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
    const newRef = push(ref(db, `subscriptions/${profile.id}`));
    await set(newRef, { ...body, created_at: new Date().toISOString() });
    return jsonResponse({ status: "success", message: "Subscription saved" });
  }

  if (endpoint === "remove_subscription.php") {
    if (method !== "POST") return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
    const subId = body.id || body.subscription_id;
    const endpointValue = body.endpoint;
    if (subId) {
      await remove(ref(db, `subscriptions/${profile.id}/${subId}`));
      return jsonResponse({ status: "success", message: "Subscription removed" });
    }
    if (endpointValue) {
      const subs = await collectList(`subscriptions/${profile.id}`);
      const matched = subs.find((s) => s.endpoint === endpointValue);
      if (matched) {
        await remove(ref(db, `subscriptions/${profile.id}/${matched.id}`));
      }
      return jsonResponse({ status: "success", message: "Subscription removed" });
    }
    return jsonResponse({ status: "error", message: "Missing subscription id" }, 400);
  }

  return jsonResponse({ status: "error", message: "Not found" }, 404);
};

const handlePushVapidPublic = async () => {
  return jsonResponse({ publicKey: null });
};

export const installFirebaseBackendShim = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const urlString = typeof input === "string" ? input : input.url;
    const url = new URL(urlString, window.location.origin);
    const endpoint = parseEndpoint(url.pathname);

    if (!endpoint) {
      return originalFetch(input, init);
    }

    try {
      const method = (init.method || "GET").toUpperCase();
      const { fields, files } = parseBody(init);

      switch (endpoint) {
        case "login.php":
          return await handleLogin(method, fields);
        case "register.php":
          return await handleRegister(method, fields);
        case "google_login.php":
          return await handleGoogleLogin(method, fields);
        case "forgot_password.php":
          return await handleForgotPassword(method, fields);
        case "verify.php":
          return await handleVerify();
        case "users.php":
          return await handleUsers();
        case "announcements.php":
          return await handleAnnouncements(method, fields, url.searchParams);
        case "mark_read.php":
          return await handleMarkRead(method, fields);
        case "projects.php":
          return await handleProjects(method, fields);
        case "comments.php":
          return await handleComments(method, fields, url.searchParams, files);
        case "project_progress.php":
          return await handleProjectProgress(method, fields, url.searchParams);
        case "profile.php":
          return await handleProfile(method, fields, url.searchParams, files);
        case "update_profile.php":
          return await handleUpdateProfile(method, fields);
        case "location.php":
          return await handleLocation(method, fields, url.searchParams);
        case "list_subscriptions.php":
        case "save_subscription.php":
        case "remove_subscription.php":
          return await handleSubscriptions(endpoint, method, fields);
        case "push_vapid_public.php":
          return await handlePushVapidPublic();
        default:
          return jsonResponse({ status: "error", message: "Not implemented" }, 404);
      }
    } catch (error) {
      console.error("Firebase backend shim error:", error);
      return jsonResponse({ status: "error", message: error.message || "Server error" }, 500);
    }
  };
};
