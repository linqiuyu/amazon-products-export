import ext from "./utils/ext";

let products_data = [];
let product_slugs = [];

/**
 * 去除首尾空格
 * @param {string} str 
 * @returns 
 */
function trimStr(str){
  return str.replace(/(^\s*)|(\s*$)/g,"");
}

/**
 * 从文档中获取产品数据
 * @param {*} resonse 
 * @param string sku
 * @param object args
 */
function getProductData(resonse = null, sku = null, args = {}) {
  if (!sku) {
    return;
  }

  if (product_slugs.includes(sku)) {
    return;
  }

  let _document;
  if (resonse) {
    _document = resonse;
  } else {
    _document = document;
  }

  let data = {
    sku: sku,
    title: '',
    overviews: {},
    feature_list: [],
    images: [],
    type: 'simple',
    parent: null,
  };

  Object.assign(data, args);

  // 获取商品标题
  const title = _document.querySelector('#ppd #centerCol #titleSection #title #productTitle');
  if (title) {
    data.title = trimStr(title.textContent);
  }

  // 获取商品价格
  const price = _document.querySelector('#ppd #centerCol #apex_desktop span.a-price .a-offscreen');
  if (price) {
    data.price = trimStr(price.textContent);
  }

  // 获取商品星级
  const star = _document.querySelector('#ppd #centerCol #averageCustomerReviews_feature_div span.a-icon-alt');
  if (star) {
    const reg = /\d.*(\d\.?\d)|(\d\.?\d).*\d/g;
    const exec = reg.exec(trimStr(star.textContent));
    if (exec[1]) {
      data.star = exec[1];
    }
    if (exec[2]) {
      data.star = exec[2];
    }
  }

  // 获取概述
  const overviews = _document.querySelectorAll('#productOverview_feature_div .a-expander-content table tr');
  if (overviews) {
    overviews.forEach(function(overview) {
      const _overview = overview.querySelectorAll('td');
      if ( 2 === _overview.length ) {
        data.overviews[trimStr(_overview[0].textContent)] = trimStr(_overview[1].textContent);
      }
    });
  }

  // 获取商品特征列表
  const featureList = _document.querySelectorAll('#featurebullets_feature_div #feature-bullets ul.a-unordered-list li');
  if (featureList) {
    featureList.forEach(function(feature) {
      data.feature_list.push(trimStr(feature.textContent));
    });
  }
  

  // 获取商品描述
  const description = _document.querySelector('#aplus div');
  if (description) {
    const imgs = description.querySelectorAll('img');
    imgs.forEach(function(img) {
      if ( img.dataset.src ) {
        img.setAttribute('src', img.dataset.src);
      }
    });
    data.description = description.innerHTML;
  }

  // 获取商品图片
  const images = _document.querySelector('#ppd #imageBlock_feature_div');
  if (images) {
    const images_patt = /<script.*>(?:.|\n)*var data = {(?:.|\n)*'colorImages': { 'initial': (.*)},\n/.exec(images.innerHTML);
    if (images_patt) {
      const imagesArray = JSON.parse(images_patt[1]);
      imagesArray.forEach(function(image) {
        if (image.hiRes) {
          data.images.push(image.hiRes);
          return;
        } 

        if (image.large) {
          data.images.push(image.large);
          return;
        }

        if (image.thumb) {
          data.images.push(image.thumb);
          return;
        }
      })
    }
  } 

  // 获取变体数据
  if (!data.parent ) {
    const variations = _document.querySelector('#ppd #twister_feature_div');
    if (variations) {
      data.type = 'variation';
      const variations_patt = /<script.*>(?:.|\n)*var dataToReturn = \{(?:.|\n)*"dimensionToAsinMap"\D?:\D?(\{.*\}),\n/.exec(variations.innerHTML);
      if (variations_patt) {
        const variation_objects = JSON.parse(variations_patt[1]);
        data.variations = variation_objects;
  
        Object.values(data.variations).forEach(function(variation) {
          httpGet('/dp/' + variation, {
            type: "variartion",
            parent: sku,
          })
        });
      }
    }
  }

  // 获取变体属性
  const attrs = _document.querySelectorAll('#twister_feature_div form#twister .a-section');
  if ( attrs ) {
    data.attrs = [];
    attrs.forEach(function(item) {
      const attr_name = trimStr(item.querySelector('.a-form-label').textContent).replace(/:$/g,"");
      const attr_value = trimStr(item.querySelector('.selection').textContent);
      data.attrs.push({
        name: attr_name,
        value: attr_value
      })
    })
  }

  products_data.push(data);
  product_slugs.push(sku);
  console.log( products_data );
}

/**
 * 从url中获取sku
 * @param string url 
 * @returns 
 */
function getSkuFromUrl(url = null) {
  if (!url) {
    url = window.location.href;
  }

  const pattern = /[\w\:\.\/-]*dp\/(\w+)\/*/.exec(decodeURIComponent(url));

  if (pattern) {
    return pattern[1];
  } else {
    return null;
  }
}

/**
 * 获取页面数据
 * @param string theUrl 
 * @param object args
 */
function httpGet(theUrl, args = {})
{
    let xmlhttp;

    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    const sku = getSkuFromUrl(theUrl);
    if ( product_slugs.includes(sku) ) {
      return;
    }

    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          getProductData(xmlhttp.responseXML, sku, args);
        }
    }

    xmlhttp.open("GET", theUrl, true );
    xmlhttp.responseType = 'document';
    xmlhttp.send();  
}

// 获取商品列表
const items = document.querySelectorAll('span.s-latency-cf-section .s-main-slot.s-search-results .s-result-item[data-uuid]');

let i = 0;
items.forEach(function(item) {
    const a = item.querySelector('h2 a.a-link-normal');
    if (a) {
      if (i === 0) {
        const url = a.getAttribute('href');
        httpGet(url);
      }
      i ++;
    }

    console.log(111);
});

