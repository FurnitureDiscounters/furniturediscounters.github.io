// Representative collection photos; these do not create product listings or inventory.
export const collectionDefaults={
  'living-room':'assets/images/sofa.webp',bedroom:'assets/images/bed.webp',
  'dining-room':'assets/images/dining.webp',office:'assets/images/desk.webp',
  mattresses:'assets/images/mattress.webp','accent-furniture':'assets/images/armchair.webp'
};
export function collectionPhotoPath(database,row,kind='category'){
  const product=database.products.find(p=>p.active&&p[kind]===row.id);
  const parent=kind==='subcategory'?database.categories.find(c=>c.id===row.category):row;
  return row.imagePath||product?.images[0]||parent?.imagePath||collectionDefaults[parent?.id]||collectionDefaults['accent-furniture'];
}
