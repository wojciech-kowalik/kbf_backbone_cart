
/**
 *
 * Cart preview app
 * 
 * @version 1.3.3
 * @author w.kowalik 
 * @package kbf\js
 * @access public
 * @see backbone.js, underscore.js, accounting.js, json2.js
 * @todo unit test, qunit
 * 
 * @description primary cart preview
 *              checked by jslint with strict mode
 * @copyright visualnet.pl 2014
 */

var Visualnet = Visualnet || {};
var Backbone = Backbone || {};
var Cufon = Cufon || {};
var jQuery = jQuery || {};

jQuery(document).ready(function () {
        
    "use strict";

    /**
     * App version number
     * 
     * @var Number 
     */
    Visualnet.APP_VERSION = '1.3.3';
    
    /**
     * Current Vat value
     * 
     * @var Number 
     */
    Visualnet.VAT = 0.23;
            
    /**
     * Translate dictionary
     * 
     * @var Object
     */
    Visualnet.dictionary = {

        pl: {
            error_delete: "Wystąpił błąd podczas usuwania pozycji w koszyku - proszę odświeżyć stronę",
            error_update: "Wystąpił błąd podczas edycji pozycji w koszyku - proszę odświeżyć stronę",
            error_attributes: "Wystąpił błąd podczas pobierania atrybutów"
        },

        en: {
            error_delete: "An error occurred during item delete - please refresh webpage",
            error_update: "An error occurred during item update - please refresh webpage",
            error_attributes: "An error occurred during the collection of attributes"
        }

    };
    
   /**
    * Translate helper
    * 
    * @return String
    */
    Visualnet._ = function (key) {
        
        var language = jQuery("#language-handler").html();
        
        if (_.isEmpty(language)) {
            language = "pl";
        }
        
        if (Visualnet.dictionary[language][key] === undefined) {
            throw new Error("[cart-preview.mvc.js] Translation for '" + key + "' dosen't exists");
        }
        return Visualnet.dictionary[language][key];
        
    };
    
    /**
    * CartItem model
    * 
    * @class Backbone.Model
    * @param Object
    */
    Visualnet.CartItem = Backbone.Model.extend({
        
        // describe id attribute
        idAttribute: "id",
        
        // set default data
        defaults: function () {
            return {
                id: 0,
                productId: 0,
                name: "Product name",
                price: 0,
                worth: 0,
                quantity: 0,
                isTicket: false,
                factor: "",
                size: "",
                factors: [],
                sizes: [],
                discount: "",
                discounts: []
            };
        },
        
        // each item has to have default value     
        initialize: function () {
            if (!this.get("vat")) {
                this.set({
                    "vat": Visualnet.VAT
                });
            }
        },
                
        // delete cart item
        deleteItem: function () {
            
            var state = false;
            
            jQuery.ajax({
                type: "GET",
                url: Visualnet.Config.CART_SERVICE_URL + "delete.xml",
                async: false,
                data: {
                    cart_id: this.get("id")
                },
                success: function () {
                    state = true;
                },
                error: function () {
                    console.warn("[cart-preview.mvc.js] " + Visualnet._("error_delete"));
                    alert(Visualnet._("error_delete"));
                    return;
                }
            });
            
            return state;
            
        },
        
        // update cart item
        updateItem: function (quantity) {
                        
            var state = false, id = this.get("id"), item, price,
                factorValue, discountValue, sizeValue,
                factor = jQuery("#product-factor-" + id).val(),
                size = jQuery("#product-size-" + id).val(),
                discount = jQuery("#product-discount-" + id).val();
                
                if(this.get("isTicket") === true && discount !== undefined) {
                    discountValue = discount;
                    discount = "&data[discount]=" + discount;
                }else{
                    discountValue = '';
                    discount = '';
                }
                
                // check if cart item has factor 
                if (factor !== undefined) {
                    factorValue = factor;
                    factor = "&data[factor]=" + factor; 
                } else {
                    factorValue = '';
                    factor = '';
                }
               
                // check if cart item has size
                if (size !== undefined) {
                    sizeValue = size;
                    size = "&data[size]=" + size;
                } else {
                    sizeValue = '';
                    size = '';
                }
                
            jQuery.ajax({
                type: "GET",
                url: Visualnet.Config.CART_SERVICE_URL
                    + "updateItem.xml?data[cart_id]=" + id
                    + "&data[quantity]=" + quantity
                    + factor
                    + size
                    + discount,
                async: false,
                success: function (response) {
                    state = true;
                    item = jQuery(response).find("cart_item");   
                },
                error: function (xhr, status, error) {
                        
                    var parser, xmlDoc;    
                        
                    if (window.DOMParser)
                    {
                      parser = new DOMParser();
                      xmlDoc = parser.parseFromString(xhr.responseText,"text/xml");
                    }
                    else // Internet Explorer
                    {
                      xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                      xmlDoc.async = false;
                      xmlDoc.loadXML(xhr.responseText); 
                    }            
            
                    console.warn("[cart-preview.mvc.js] " + Visualnet._("error_update"));
                    alert(xmlDoc.getElementsByTagName("error")[0].getAttribute('message'));
                    return;
                }
            });
            
                        
            // if update succedded
            if (state === true) {
               
                price = jQuery(item).find("price").text().replace(',', '.');
                                
                this.set("discount", discountValue);
                this.set("factor", factorValue);
                this.set("size", sizeValue);
               
                this.set("worth", accounting.formatNumber(parseFloat(price) * parseInt(this.get("quantity"), 10), 2, ""));
                this.set("price", price);
                
            }
            
            return state;
            
        }
        
    });
    
    /**
    * CartItem collection
    * 
    * @class Backbone.Collection
    * @param Object
    */
    Visualnet.CartItemList = Backbone.Collection.extend({
        
        // get webservice url
        url: function () {
            return Visualnet.Config.CART_SERVICE_URL + 'preview.xml?' + Math.random();
        },
        
        // set model to collection
        model: Visualnet.CartItem,
        
        // get items for attribute
        getItems: function (attribute) {
          
          var result = [],
              items = jQuery(attribute).find("item");
                 
            if (items) {
                items.each(function (i, item) {
                    result.push(jQuery(item).attr("value"));
                });
                
                return result;
                
            }
            
            return [];
          
        },
        
        // get discounts for ticket
        getDiscounts: function (discounts, productName) {
          
          var result = [],
              items = jQuery(discounts).find("discount");
                 
            if (items) {
                
                // default discount value as product name
                result.push({id: '', name: productName});
                
                items.each(function (i, item) {
                  
                    result.push({id: jQuery(item).attr("id"), name: jQuery(item).children("name").text()});
                    
                });
                
                return result;
                
            }
            
            return [];          
            
        },
        
        // parse xml data into objects
        parse: function (responseXML) {
            
            if (typeof (responseXML) !== "document") {
                responseXML = responseXML.documentElement;
            }
            
            var that = this, collection = [], discounts, productName,
                items = jQuery(responseXML).find("item");

            // iterate over elements
            items.each(function (i, item) {
                
                var data = jQuery(item),
                           price = parseFloat(data.children("price").text().replace(',', '.')),
                           quantity = parseInt(data.children("quantity").text(), 10),
                           factors = [], sizes = [], attributes;
                
                // get worth
                Visualnet.worth = accounting.formatNumber(price * quantity, 2, "");

                // get ticket values
                if (data.attr("type") === "CartItemPlace" || data.attr("type") === "CartItemRepertoire") {
                    
                    Visualnet.itemName = data.children("event").attr("name")
                        + "<br />" + data.children("event").attr("date")
                        + "<br />" + "rz\u0105d: " + data.children("row").text()
                        + " miejsce: " + data.children("number").text();
                                   
                    discounts = data.children("discounts");     
                    productName = data.children("name").text();
                                  
                    collection.push({
                        id: data.attr("cart_id"),
                        productId: data.attr("product_id"),
                        name: Visualnet.itemName,
                        price: data.children("price").text(),
                        worth: Visualnet.worth,
                        quantity: data.children("quantity").text(),
                        discounts: that.getDiscounts(discounts, productName),
                        discount: discounts.attr("id"),
                        isTicket: true
                    });
                
                // get product values
                } else if (data.attr("type") === "CartItem") {

                    // request for product attributes
                    jQuery.ajax({
                        type: "GET",
                        url: Visualnet.Config.ATTRIBUTES_SERVICE_URL + data.attr("product_id"),
                        async: false,
                        success: function (response) {
                            attributes = response;
                        },
                        error: function () {
                            console.warn("[cart-preview.mvc.js] " + Visualnet._("error_attributes"));
                        }
                    });

                    collection.push({
                        id: data.attr("cart_id"),
                        productId: data.attr("product_id"),
                        name: data.children("name").text(),
                        price: data.children("price").text(),
                        worth: Visualnet.worth,
                        quantity: data.children("quantity").text(),
                        factor: data.children("factor").text(),
                        size: data.children("size").text(),
                        factors: that.getItems(jQuery(attributes).find("factors")),
                        sizes: that.getItems(jQuery(attributes).find("sizes")),
                        isTicket: false
                    });
                    
                }
            });
                        
            return collection;
            
        },
        
        // call for prototype fetch with options
        fetch: function (options) {
            
            options = options || {};
            options.dataType = "xml";
            Backbone.Collection.prototype.fetch.call(this, options);
        },
        
        // get sum of cart item prices
        sum: function () {
            return this.reduce(function (memo, model) {
                return parseFloat(memo) + parseFloat(model.get("worth").replace(',', '.'));
            }, 0);
        }
        
    });
    
    // instance of collection
    Visualnet.cartItemList = new Visualnet.CartItemList();
    
    /**
    * Single cart item view
    * 
    * @class Backbone.View
    * @param Object
    */
    Visualnet.CartItemView = Backbone.View.extend({
        
        // set view element
        className: "tr bottom-border",
        
        // get default item template
        template: _.template(jQuery("#cart-item").html()),
        
        // events handlers
        events: {
            "click .item-delete"            : "deleteItem",
            "click .cart-quantity"          : "clean",
            "click .jquery-selectbox-item"  : "updateAttributes"
        },
        
        // update product attributes
        updateAttributes: function () {

          this.model.updateItem(this.model.get("quantity"));
          
        },
        
        // initialize for view 
        initialize: function () {
            
            // bind event for change of the model
            this.model.on("change", this.render, this);
            
        },
        
        // clean field
        clean: function () {
          
          jQuery("#" + this.model.get("id")).removeClass("cart-quantity-error");
          
        },
        
        // render function
        render: function () {
                        
            // replace font
            Cufon.replace(".item-delete");                        
                        
            var clone = this.model;

            clone.set("price", clone.get("price").replace('.', ','));
            clone.set("worth", clone.get("worth").replace('.', ','));
            
            this.$el.html(this.template(clone.toJSON()));
                        
            return this;
        },
        
        // delete cart item
        deleteItem: function () {
            
            if (this.model.deleteItem()) { // if cart item was deleted remove it from view
                
                jQuery("#loader .loader-root .loader-dialog .center").html("proszę czekać ...");
                jQuery('#loader').show();                
                
                this.$el.fadeOut("slow");
                Visualnet.cartItemList.remove(this.model);
                
                jQuery('#loader').hide();
            }
        }
        
    });
   
    /**
    * Main AppView
    * 
    * @class Backbone.View
    * @param Object
    */
    Visualnet.AppView = Backbone.View.extend({
        
        // default app element
        el: jQuery("#middle-content"),
        
        // get main template
        mainSceleton: _.template(jQuery("#cart-preview").html()),
        
        // get recalculate element
        cartSum: _.template(jQuery("#cart-sum").html()),
        
        // events handlers
        events: {
            "click #continue-shopping a"    : "reload",
            "click #realize-order a"        : "order",
            "click .cart-recalculate"       : "recalculate"
        },
        
        // intialize function
        initialize: function () {

            this.$el.html(this.mainSceleton);
            
            // setting of objects collection
            Visualnet.cartItemList.bind("add", this.one, this);
            Visualnet.cartItemList.bind("reset", this.all, this);
            Visualnet.cartItemList.bind("all", this.render, this);
            
            // set fonts
            Cufon.replace("#table-data div.th div.td");
            Cufon.replace("#continue-shopping a");
            Cufon.replace("#realize-order a");
            Cufon.replace(".cart-header");
            Cufon.replace(".cart-recalculate");
            
            // hide available content
            jQuery(".wrapper").css("opacity", 0.1);
            
            Visualnet.cartItemList.fetch();
        },
        
        // recalculate cart item
        recalculate: function () {

            // iterate over collection
            Visualnet.cartItemList.each(function (item) {
                
                var changed = Math.abs(jQuery("#" + item.get("id")).val()),
                              present = item.get("quantity"),
                              calculateWorth = 0;
                
                // change quantity if item is ticket
                if(item.get("isTicket") === false){
                
                    // validate quantity
                    if (isNaN(changed)) {

                        jQuery("#" + item.get("id")).addClass("cart-quantity-error");

                    } else {

                        // check if present and changed value are the same
                        if (changed !== present) {

                            // update cart item in database
                            if (item.updateItem(changed)) {

                                // calculate worth
                                calculateWorth = changed * (parseFloat(item.get("price").replace(',', '.')));
                                calculateWorth = accounting.formatNumber(calculateWorth, 2, "");

                                // update model data
                                item.set("quantity", changed);
                                item.set("worth", calculateWorth);
                            }
                        }

                    }
                
                }
                
            });
            
            // rerender cart preview
            this.render();
        },
        
        // make order redirect
        order: function () {
            window.location = Visualnet.Config.ORDER_URL;
        },
        
        // reload browser's window
        reload: function () {
            window.location.reload();
        },
        
        // set one cart item
        one: function (cartItem) {
            
            var view = new Visualnet.CartItemView({
                model: cartItem
            });
            
            jQuery("#table-data").append(view.render().el);
        },
        
        // set all collection 
        all: function () {
            
            // iterate over collection
            Visualnet.cartItemList.each(this.one);
        },
        
        // main app render method
        render: function () {
            
            var sum = Visualnet.cartItemList.sum();
            
            // hide order button
            if (sum === 0) {
                jQuery("#realize-order").fadeOut("slow");
            }
                        
            jQuery("#recalculate-container").html(this.cartSum({
                sum: accounting.formatNumber(sum, 2, "").replace('.', ',')
            }));
            
            // change dropdowns
            jQuery("select").selectbox();
            
            // change font for rendered elements
            Cufon.replace(".sum");
            Cufon.replace(".cart-recalculate");
            Cufon.replace(".sum-value");
            Cufon.replace(".item-delete");
            
            // set width of select list
            jQuery(".jquery-selectbox-list").width(250);
            
        }
        
    });
        
});