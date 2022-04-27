const sharp = require("sharp");
module.exports = function Cart(oldCart) {
  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;

  oldCart.cod === false ? (this.cod = oldCart.cod) : (this.cod = true);

  this.decreaseSize = async (item) => {
    let save = item;
    item = {};
    item._id = save._id;
    // item.image = save.images[0].image;
    item.image = await sharp(Buffer.from(save.images[0].image, "base64"))
      .resize({ width: 80, height: 80 })
      .toBuffer();
    const base64String = Buffer.from(item.image).toString("base64");
    item.image = base64String;
    item.name = save.name;
    item.slug = save.slug;
    item.color_selected = save.color_selected;
    item.size_selected = save.size_selected;
    item.price = save.price;
    return item;
  };

  this.add = async function (raw_item, id) {
    var storedItem = this.items[id];
    if (!storedItem) {
      raw_item.cod === false || this.cod === false
        ? (this.cod = false)
        : (this.cod = true);
      let item = await this.decreaseSize(raw_item);
      storedItem = this.items[id] = { item, qty: 0, price: 0 };
    }

    if (
      (raw_item.color_selected != storedItem.item.color_selected ||
        raw_item.size_selected != storedItem.item.size_selected) &&
      storedItem.qty != 0
    ) {
      throw "You Can't Choose Two Different Size/Color In Single Cart";
    }
    storedItem.qty++;
    storedItem.price = storedItem.item.price * storedItem.qty;
    this.totalQty++;
    this.totalPrice += storedItem.item.price;
  };

  this.reduceByOne = (id) => {
    if (!this.items[id]) {
      throw "Invalid Attempt";
    }
    this.items[id].qty--;
    this.items[id].price -= this.items[id].item.price;
    this.totalQty--;
    this.totalPrice -= this.items[id].item.price;
    if (this.items[id].qty <= 0) {
      delete this.items[id];
    }
  };

  this.removeProduct = (id) => {
    this.totalQty -= this.items[id].qty;
    this.totalPrice -= this.items[id].price;
    delete this.items[id];
    if (this.totalQty === 0) {
      this.cod = true;
    }
  };

  this.generateArray = function () {
    var arr = [];
    for (var id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  };
};
