import supabase, { supabaseUrl } from "./supabase";

export async function signup({ fullName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fullName,
        avatar: "",
      },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getCurrentUser() {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data?.user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updateCurrentUser({
  password,
  fullName,
  newAvatarFile,
  currentAvatarURL,
}) {
  // >#1. Update the fullName OR password
  // ->#1.1 Prep Update Data
  let updateData;
  if (password) updateData = { password };
  if (fullName)
    updateData = {
      // update user_metadata therefore its data key per supabase API
      data: { fullName },
    };
  // ->#1.2 Update User Data
  const { data: updatedUserData, error: updateUserError } =
    await supabase.auth.updateUser(updateData);
  if (updateUserError) {
    throw new Error(updateUserError.message);
  }
  // ->#1.3 Early return if no new Avatar file is provided
  if (!newAvatarFile) return;

  // >#2. Proceed w/ Uploading the new avatar image
  const currentAvatarFileName = currentAvatarURL.split("/").pop();
  const currentAvatarFileExists = currentAvatarURL !== "";
  let fileName;
  // ->#2.2 Upsert the new avatar image
  if (currentAvatarFileExists) {
    fileName = currentAvatarFileName;
    const { error: upsertAvatarError } = await supabase.storage
      .from("avatars")
      .upload(currentAvatarFileName, newAvatarFile, {
        upsert: true,
      });
    if (upsertAvatarError) {
      throw new Error(
        "Error upserting the new avatar file: " + upsertAvatarError.message
      );
    }
  } else {
    // ->#2.1 Prepare the new avatar img name for storing
    fileName = `avatar-${updatedUserData.user.id}-${Date.now()}`;
    // ->#2.2 Upload the new file
    const { error: uploadNewAvatarError } = await supabase.storage
      .from("avatars")
      .upload(fileName, newAvatarFile, {
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadNewAvatarError) {
      throw new Error(
        "Error uploading the new avatar file: " + uploadNewAvatarError.message
      );
    }
  }

  // >#3. Update the avatar in the user data via Cache-Busting Query Parameter to cover also no-avatr picture name change
  const { error: updateUserDataError } = await supabase.auth.updateUser({
    data: {
      avatar: `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}?bust=${new Date().getTime()}`,
    },
  });
  if (updateUserDataError) {
    throw new Error(updateUserDataError.message);
  }
}
