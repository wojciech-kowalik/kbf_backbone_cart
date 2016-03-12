
var Visualnet = Visualnet || {};
var jQuery = jQuery || {};
var _ = _ || {};

/**
 * Image belt class constructor
 * 
 * @class Visualnet.Belt
 * @constructor 
 * @namespace Visualnet
 * @param {Array} selectors pointing selectors
 * @param {Object} options configuration object
 * @author w.kowalik 
 * @access public
 * @uses underscore.js, jquery.js, belt.css, belt.png
 * 
 * @description 
 * 
 *  Example use: 
 *  params
 *  
 *  require array of selectors
 *  default options object with element offset
 *  
 *  new Visualnet.ImageBelt([".sige li span a"], {offset: 3}).make();
 *  
 * @copyright visualnet.pl 2012
 */
Visualnet.Belt = function (selectors, options) {
         
     "use strict";
         
     /**
      * Default offset for belt
      * 
      * @property offset
      * @type Integer
      * @default 3
      */
     var offset = 3;
     
     /**
      * Show warnings when appears
      * 
      * @property warning
      * @type Boolean
      * @default false
      */
     var warning = false;
     
     /**
      * Constraint of use new operator
      */     
     if (!(this instanceof Visualnet.Belt)) {
         return new Visualnet.Belt();
     }
     
    /**
     * Init method after create instance
     * @method init
     * @return void
     */
    (function init() {
        
        // if options object exists
        if (_.isObject(options)) {
            
            // override offset
            if (options.offset) {
                offset = options.offset;
            }
            
            // override show warning flag
            if (options.warning) {
                warning = options.warning;
            }
        }
        
     })();
     
    /**
     * Get element's selectors
     * 
     * @method _getSelectors
     * @access private
     * @throw Error
     * @return {Array} specifed selectors
     */
    var _getSelectors = function () {
         
        if (_.isArray(selectors) === false || _.isEmpty(selectors)) {
            throw new Error("[belt.js] An error occured: wrong entry parameter");
        }
         
        return selectors;
    };
     
    /**
     * Make belts on images
     * 
     * @method make
     * @access public
     * @throw Error
     * @return void
     */
    this.make = function () {
         
        var selectors = _getSelectors(),
                        i, selectorsLength, images, div, img, span, clone;
        
        // iterate over selectors
        for (i = 0, selectorsLength = selectors.length; i <= selectorsLength - 1; i++) {

            // get images
            images = jQuery(selectors[i]).children("img");

            // if noticed selector dosen't have any elements, get next iterate
            if (images.length === 0) {
                
                if (warning) {
                    console.warn("[belt.js] There aren't any elements for selector " + selectors[i]);
                }
                continue;
            }
            
            // iterate over images
            images.each(function () {
                    
                // get copy of current image    
                clone = jQuery(this);
                
                // hide origin
                jQuery(this).hide();
                    
                // make container for new content
                div = jQuery("<div>").attr("id", _.uniqueId('belt-')).addClass("belt").css("width", clone.width()).css("float", "left");
                img = jQuery("<img>").attr("src", clone.attr("src"));
                span = jQuery("<span>").css("width", clone.width() + offset);

                div.append(img);
                div.append(span);
                
                // set new content after hidden old
                clone.after(div);
 
            });

        }
         
    };
};

