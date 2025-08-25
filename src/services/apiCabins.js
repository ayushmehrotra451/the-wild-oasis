import supabase, { supabaseUrl } from "./supabase";

export async function getCabins() {
  const { data, error } = await supabase.from("cabins").select("*");
  if (error) {
    console.error(error);
    throw new Error("Cabin could not be loaded");
  }
  return data;
}

export async function createEditCabin(newCabin, id) {
  const hasImagePath = newCabin.image?.startsWith?.(supabaseUrl);

  const cabinName = `${Math.random()}-${newCabin.image.name}`.replaceAll(
    "/",
    ""
  );
  const cabinPath = hasImagePath
    ? newCabin.image
    : `${supabaseUrl}/storage/v1/object/public/cabin-images/${cabinName}`;

  let query = supabase.from("cabins");
  if (!id) {
    query = query.insert([{ ...newCabin, image: cabinPath }]);
  }
  if (id) {
    query = query
      .update({ ...newCabin, image: cabinPath })
      .eq("id", id)
      .select();
  }
  const { data, error } = await query.select().single();

  if (error) {
    console.error(error);
    throw new Error("Cabin could not be created");
  }

  if (hasImagePath) return data;
  const { error: storageError } = await supabase.storage
    .from("cabin-images")
    .upload(cabinName, newCabin.image);

  if (storageError) {
    await supabase.from("cabins").delete().eq("id", data.id);
    console.error(storageError);
    throw new Error("Uploading issues. Cabin could not be created");
  }
  return data;
}

export async function deleteCabin(id) {
  // #1. Read the cabin data pertinent to this id - to be used reverting the data if failed deleting the image
  const { data: cabin, error: cabinReadError } = await supabase
    .from("cabins")
    .select("*")
    .eq("id", id);
  if (cabinReadError) {
    console.error(cabinReadError);
    throw new Error("Can't retrieve cabin information from DB");
  }
  const imgFileName = cabin[0].image.split("/").at(-1);
  const backupCabinData = cabin[0];

  // #2. Delete the cabin item from DB cabins table
  const { error: cabinDeleteError } = await supabase
    .from("cabins")
    .delete()
    .eq("id", id);
  if (cabinDeleteError) {
    console.error(cabinDeleteError);
    throw new Error("Cabin could not be deleted");
  }

  // #3. Delete Image from DB bucket
  const { error: fileRemoveError } = await supabase.storage
    .from("cabin-images")
    .remove([imgFileName]);
  if (fileRemoveError) {
    //Revert deletion
    createCabin(backupCabinData);
    //Error handling
    console.error(fileRemoveError);
    throw new Error(
      "Encountered a problem removing the cabin image. Cabin did not get deleted."
    );
  }
}
