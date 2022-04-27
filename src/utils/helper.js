const reduceImages = (productArray) => {
  let products = [];
  for (let product of productArray) {
    let save = product;
    product = {};
    product.images = [{ image: "0" }];
    product.slug = save.slug;
    product.colors = save.colors;
    product.name = save.name;
    product.price = save.price;
    product.discount_percent = save.discount_percent;
    product.fullprice = save.fullprice;
    product.isExclusive = save.isExclusive;
    product.images[0].image = save.images[0].image;
    products.push(product);
  }
  return products;
};

module.exports = {
  reduceImages,
};
