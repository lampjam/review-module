//This JS file generates data using faker and populates it to the database.
//This script will truncate all tables before creating new data.

//pacakage declarations
var faker = require('faker');
var mysql = require('mysql');

//database connection
var mysqlConfig = require('./config.js');
var db = mysql.createConnection(mysqlConfig);

//random collection of product thumbnails
const productImages = [
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/product_thumbnail.jpg',
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/product_thumbnail2.jpg',
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/product_thumbnail3.jpg',
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/product_thumbnail4.jpg',
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/product_thumbnail5.jpg'
];

//random collection of review images
const reviewImages = [
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/large_review_image.jpg',
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/large_review_image_2.jpg',
'https://etsydoppleganger.s3-us-west-1.amazonaws.com/large_review_image_3.jpg'
];

//truncate tables
const tables = ['reviews', 'product_list', 'products', 'shops', 'customers'];

for (let i = 0; i < tables.length; i++) {
  db.query(`delete from ${tables[i]};`);
  console.log(`${tables[i]} cleared.`);
}

//create a list of fake customers.  Customers will have a random chance
//to have an avatar (to reflect some users not uploading one.)
for(let i = 0; i < 25; i++) {
  let customerName = faker.fake("{{internet.userName}}");
  let cutomerAvatar = null;
  if(Math.random() > 0.4) {
    customerAvatar = faker.fake("{{image.avatar}}");
    db.query(`insert into customers (customer_name, customer_avatar) values ("${customerName}", "${customerAvatar}")`);
  } else {
    db.query(`insert into customers (customer_name) values ("${customerName}")`);
  }

}
console.log("Customers seeded.");

//create a small list of fake shops.  For the purposes of demonstration, only 1-2 shops
//are needed.
for(let i = 0; i < 1; i++) {
  let shopName = faker.fake("{{company.companyName}}");
  db.query(`insert into shops (shop_name) values ("${shopName}");`);
}
console.log("Shops seeded.");

//create a small list of products.
for(let i = 0; i < 15; i++) {
  let productName = faker.fake("{{commerce.productName}}");
  //product image will be small in any given review
  //placeholder for an actual image thumbnail.
  let productThumbnail = productImages[Math.floor(Math.random() * productImages.length)];

  db.query(`insert into products (product_name, product_thumbnail) values ("${productName}", "${productThumbnail}");`);
}
console.log("Products seeded.");

//once the base tables have been seeded, populate the tables with dependencies

//populate the product_list table
db.query(`select product_id from products;`, function(err, result) {
  if(err) {
    console.log(err);
  } else{
    //create an array of product IDs
    let productId = [];
    for(let i = 0; i < result.length; i++) {
      productId.push(result[i].product_id);
    }
    //console.log(productId);
    db.query(`select shop_id from shops;`, function(err, result) {
      if(err) {
        console.log(err);
      } else {
        //create an array of shop IDs
        let shopId = [];
        for(let i = 0; i < result.length; i++) {
          shopId.push(result[i].shop_id);
        }
        //console.log(shopId);

        //add products to product_list table: randomize shop if more than one exists.
        for(let i = 0; i < productId.length; i++) {
          let chosenShop = Math.floor(Math.random() * shopId.length);

          db.query(`insert into product_list (shop_id, product_id) values (${shopId[chosenShop]}, ${productId[i]});`);
        }
      }
    });
  }
});
console.log("Product list seeded.");

//finally, populate the reviews table.  Get the customer and product IDs,
//then create a set of reviews with random customers/products assigned to them.
db.query(`select product_id from products;`, function(err, result) {
  if(err) {
    console.log(err);
  } else{
    //create an array of product IDs
    let productId = [];
    for(let i = 0; i < result.length; i++) {
      productId.push(result[i].product_id);
    }

    db.query(`select customer_id from customers;`, function(err, result) {
      if(err) {
        console.log(err);
      } else {
        let customerId = [];
        for(let i = 0; i < result.length; i++){
          customerId.push(result[i].customer_id);
        }

        //create a number of fake reviews, and populate them to the table.
        //TBD: add random review image
        for(let i = 0; i < 100; i++) {
          let chosenCustomer = Math.floor(Math.random() * customerId.length);
          let chosenProduct = Math.floor(Math.random() * productId.length);
          let reviewScore = Math.floor(Math.random() * 5) + 1;
          let reviewDate = new Date(faker.fake("{{date.past}}"));
          //console.log(reviewDate);
          reviewDate = reviewDate.toISOString().split('T')[0];
          let reviewText = '';
          let reviewImage = null;

          //randomly choose the review length
          if(Math.random() > 0.5) {
            reviewText = faker.fake("{{lorem.paragraph}}");
          } else {
            reviewText = faker.fake("{{lorem.sentence}}");
          }

          //randomly attach review images to certain reviews
          if(Math.random() + 0.01 < (reviewImages.length /(100-i))) {
            reviewImage = reviewImages.pop();
          }

          db.query(`insert into reviews (customer_id, product_id, review_text, review_score, review_date, review_image) values (${customerId[chosenCustomer]}, ${productId[chosenProduct]}, "${reviewText}",${reviewScore},"${reviewDate}", "${reviewImage}");`);
        }

        //close db connection when finished
        db.end();
      }
    });
  }
});
console.log("Reviews seeded.");


//close db connection when finished
//db.end();

//testing faker calls
// console.log(faker.fake("{{internet.userName}}"));
// console.log(faker.fake("{{commerce.productName}}"));
// console.log(faker.fake("{{company.companyName}}"));
// console.log(faker.fake("{{date.past}}"));
// console.log(faker.fake("{{lorem.paragraph}}"));
// console.log(faker.fake("{{lorem.sentence}}"));
// console.log(faker.fake("{{image.avatar}}"));
// console.log(faker.fake("{{image.cats}}"));
