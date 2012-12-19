//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

;(function(){

    // https://github.com/KoryNunn/crel minified
    var crel = (function(h){function f(b){return"object"===typeof Node?b instanceof Node:b&&"object"===typeof b&&"number"===typeof b.nodeType&&"string"===typeof b.nodeName}function e(){var b=window.document,a=arguments,c,d;if(1===arguments.length)return b.createElement(arguments[0]);a=j.slice.call(arguments);c=a.shift();d=a.shift();c=b.createElement(c);if(f(d)||"object"!==typeof d)a=[d].concat(a),d={};if(1===a.length&&"string"===typeof a[0]&&c.textContent!==h)c.textContent=a[0];else for(var g=0;g<a.length;g++)child=a[g],null!=child&&(f(child)||(child=b.createTextNode(child)),c.appendChild(child));for(var e in d)c.setAttribute(e,d[e]);return c}var j=[];e.isNode=f;return e})();

    function fastEach(array, callback) {
        for (var i = 0; i < array.length; i++) {
            if(callback.call(array[i], array[i], i, array)) break;
        }
        return array;
    }
    
    function contains(object, target){
        if(object == null){
            return false;
        }
        var result = false;
        fastEach(object, function(){
            if(this === target){
                result = true;
                return true;
            }
        });
        return result;
    }

    var oldSelection = !document.getSelection;
    
    //dom traversal stuff
    
    function throwUnsupported(featureName){
        throw "Your browser does not support: " + featureName + ". Support for your browser can be added by including jQuery";
    }
    
    function find(selector, element){
        element = element || document;
        if(element.querySelectorAll){
            return element.querySelectorAll(selector);
        }else if(jQuery){
            return jQuery(element).find(selector);
        }else{
            throwUnsupported('document.querySelectorAll');
        }
    }
    
    function closest(selector, element){
        if(element.querySelectorAll){
            var result,
                matches = element.parentNode && element.parentNode.parentNode && element.parentNode.parentNode.querySelectorAll(selector);
            if(!contains(matches, element)){
                return closest(selector, element.parentNode);
            }else{
                return element;
            }
        }else if(jQuery){
            return jQuery(element).closest(selector)[0];
        }else{
            throwUnsupported('document.querySelectorAll');
        }
    }
    
    function isDescendantOf(possibleDescendant, child){
        var result;
        if(child.parentNode){
            if(child.parentNode === possibleDescendant){
                return true;
            }else{
                return isDescendantOf(possibleDescendant, child.parentNode);
            }
        }
    }
    
    function getCommonSelectedNode(selection){
        selection = (selection instanceof Selection && selection) || (this instanceof Selection && this) || new Selection(selection);
        
        if(oldSelection){
            if(!selection._currentRange){
                return;
            }
            return selection._currentRange.parentElement();
        }else{
            var range;
                
            if(!(selection.originalSelection && selection.originalSelection.rangeCount)){
                return;
            }
                
            range = selection.getRangeAt(0);
            
            return range.commonAncestorContainer;
        }
    };
    
    // Selection Normalisation    
    function Selection(selection){
        if(oldSelection){
            this.originalSelection = selection || document.selection;
            this._currentRange = this.originalSelection.createRange();
            this._type = this._currentRange && this._currentRange.htmlText === "" && "Caret" || this.originalSelection.type;
        }else{
            this.originalSelection = selection || document.getSelection && document.getSelection();
            this._type = this.originalSelection.type;
        }
    }
    Selection.prototype.constructor = Selection;
    Selection.prototype.addRange = function(range){
        this.originalSelection.addRange(range);
    };
    Selection.prototype.getRangeAt = function(index){
        if(!this.originalSelection){
            return;
        }
        if(this.originalSelection.getRangeAt){
            return this.originalSelection.getRangeAt(index);
        }else{
            return this._currentRange;
        }
    };
    Selection.prototype.isCaret = function(){
        return this._type==='Caret';
    };
    //http://stackoverflow.com/questions/4709073/in-webkit-how-do-i-add-another-word-to-the-range
    Selection.prototype.selectWordAtCaret = function(){
        if(!this.isCaret()){
            return;
        }
        if(oldSelection){
            this._currentRange.expand("word");
            this._currentRange.select();
        }else{
            this.modify("move", "backward", "word");
            this.modify("extend", "forward", "word");
        }
    };
    Selection.prototype.modify = function(alter, direction, granularity){
        if(oldSelection && this._type == "Caret"){
            var range = this._currentRange;
            this.removeAllRanges();
            range.select();
            range.moveStart("word", 1);
            range.moveEnd("word", 1);
            switch(alter){
                case "move":
                    if(direction === 'forward'){
                        range.moveStart(granularity, 1);
                        range.moveEnd(granularity, 1);
                    }else{
                        range.moveStart(granularity, 1); 
                        range.moveEnd(granularity, 1);                   
                    }
                    break;
                case "extend":
                    if(direction === 'forward'){
                        range.moveEnd(granularity, 1);
                    }else{
                        range.moveStart(granularity, 1);                    
                    }
            }
            range.select();
        }else if(this.originalSelection.modify){
            this.originalSelection.modify(alter, direction, granularity);
        }
    };
    Selection.prototype.selectRange = function(range){
        if(oldSelection){
            range.select();
            return;
        }
        this.originalSelection.removeAllRanges();
        this.originalSelection.addRange(range);        
    };
    Selection.prototype.insertNodeIntoRange = function(node, range){
        if(oldSelection){
            range.pasteHTML(node.outerHTML || node.textValue);
        }else{
            range.insertNode(node);
        }
    };
    Selection.prototype.extractRangeContents = function(range){
        if(oldSelection){
            var contents = range.htmlText;
            range.pasteHTML("");
            return contents;
        }
        return range.extractContents();
    }
    Selection.prototype.wrapTargetWith = function(element, targetNode){        
        this.selectWordAtCaret();
        
        var range = this.getRangeAt(0);
            
        targetNode = targetNode || element;
        
        if(oldSelection){
            targetNode.innerHTML += this.extractRangeContents(range); 
        }else{
            targetNode.appendChild(this.extractRangeContents(range));         
        }
        
        this.insertNodeIntoRange(element, range);        
        this.selectRange(range);
    };
    Selection.prototype.getCommonNode = function(){
        getCommonSelectedNode(this.originalSelection);
    };
    Selection.prototype.getElementAtCaret = function(){
        if(this.isCaret()){
            return this.originalSelection.anchorNode;
        }
    };
    Selection.prototype.getCaretOffset = function(){
        if(this.isCaret()){
            return this.getRangeAt(0).startOffset;
        }
    };
    Selection.prototype.createRange = function(){
        if(oldSelection){
            return this.originalSelection.createRange();
        }
        return document.createRange();
    }
    Selection.prototype.removeAllRanges = function(){
        if(oldSelection){
            this.originalSelection.empty();
        }else{
            this.originalSelection.removeAllRanges();
        }
    };
    Selection.prototype.positionCaret = function(parent, offset){
        var range = this.createRange();
            
        range.setStart(parent, offset);
        range.setEnd(parent, offset);
        
        this.removeAllRanges();
        this.addRange(range);
    };
    Selection.prototype.selectNode = function(element) {
        var range = this.createRange();
        
        range.selectNodeContents(element);
        
        this.removeAllRanges();
        this.addRange(range);
    };
    
    function addControl(editor, label, operationName, operation){
        if(!(editor instanceof Freditor)){
            return;
        }
        
        var controls = editor.controls;
            
        controls.appendChild(crel('button', {'type':'button','class':'btn ' + operationName, 'data-operation':operationName}, label));
        editor.operations[operationName] = operation || editor.operations[operationName];
    }

    function createEditorControls(){
        return crel('div',{'class':'controls btn-group'});
    }
    
    
    function removeEmptyElements(element){
        //http://dev.w3.org/html5/markup/syntax.html#syntax-elements        
        var voidNodes = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        
        for(var i = 0; i < element.childNodes.length; i++){
            if(element.childNodes[i].nodeType === 3){
                if(element.childNodes[i].nodeValue === ""){
                    element.removeChild(element.childNodes[i]);
                }
            }else if(element.childNodes[i].nodeType === 8){
                // commentNode :|
                element.removeChild(element.childNodes[i]);
            }else{
                var childNode = element.childNodes[i];
                if(contains(voidNodes, childNode.tagName != null && childNode.tagName.toLowerCase()) < 0 && !element.childNodes[i].childNodes.length){
                    element.removeChild(element.childNodes[i]);
                    if(!element.childNodes.length){
                        element.parentNode.removeChild(element);
                        break;
                    }
                }else{
                    removeEmptyElements(element.childNodes[i])
                }
            }
        }
    }
	
	function appendChildren(parent, children){
        if(!(children && children.length)){
            return;
        }
		for(var i = 0; i< children.length; i++){
			parent.appendChild(children[i]);
		}
	}
    
    function replaceDivsWithParagraphs(targetElement){
        for(var i = 0; i < targetElement.childNodes.length; i++){
			var child = targetElement.childNodes[i],			
				replacementP,
                caretOffset;
				
			replaceDivsWithParagraphs(child);
            if(child.tagName === 'DIV'){
                replacementP = crel('p');
                appendChildren(replacementP, child.childNodes);
                var selection = new Selection();
                if(child === selection.getElementAtCaret()){
                    caretOffset = selection.getCaretOffset();
                }
                targetElement.insertBefore(replacementP, child);
                targetElement.removeChild(child);
                if(caretOffset != null){
                    selection.positionCaret(replacementP, caretOffset);
                }
            }
		}
    }
    
    function sanitise(){       
        var editArea = this.editArea;
        
        fastEach(find('script, style', this), function(){
            this.parentNode.removeChild(this);
        });
        fastEach(find('*', editArea), function(){
            this.removeAttribute('style');
        });
        
        replaceDivsWithParagraphs(editArea);
    }

    function Freditor(field, options){
        // clone operation list.
        this.operations = {}
        for(var key in this.constructor.prototype.operations){
            this.operations[key] = this.constructor.prototype.operations[key];
        }
        
        if(!crel.isNode(field)){
            if(field && typeof field === 'object'){
                options = field;
            }
            field = crel('textarea', {'class':'richFreditor'});            
        }
        
        this.field = field;
        
        var editor = this.element = crel('div',{'class':'freditor'}),
            editArea = this.editArea = crel('div',{'class':'editArea', 'contenteditable':'true', 'tabindex':0}),
            controls = this.controls = createEditorControls();
        
        editor.freditor = this;
        editArea.contentEditable = true;
        
        editArea.innerHTML = field.value;
        
        appendChildren(editor, [controls, editArea]);
        
        field.setAttribute('style','display:none;');
        if(editor.parentNode){
            editor.parentNode.insertBefore(field, editor.nextSibling);
        }
    }
    Freditor.prototype.constructor = Freditor;
    Freditor.prototype.operations = {
        underline: function(){
            this.selection.selectWordAtCaret();
            document.execCommand('underline',false);
        },
        bold: function(){
            this.selection.selectWordAtCaret();
            document.execCommand('bold',false);
        },
        italics: function(){
            this.selection.selectWordAtCaret();
            document.execCommand('italic',false);
        },
        bullets: function(){
            var newList = crel('ul',crel('li'));
            
            this.selection.wrapTargetWith(newList, $(newList).find('li')[0]);
        },
        numberedList: function(){
            var newList = crel('ol',crel('li'));
            
            this.selection.wrapTargetWith(newList, $(newList).find('li')[0]);
        }
    };
    Freditor.prototype.addControl = function(label, operationName, operation){
        addControl(this, label, operationName, operation);
    };
    Freditor.prototype.addDefaultControls = function(){
        this.addControl('Underline', 'underline');
        this.addControl('Bold', 'bold');
        this.addControl('Italics', 'italics');
        this.addControl('Bullets', 'bullets');
        this.addControl('Numbered List', 'numberedList');
    };
    Freditor.prototype.sanitise = sanitise;
    Freditor.prototype.performOperation = function(operation){
        if(this.selection){
            this.operations[operation].call(this);
        }
    };
    
    // addControl(editor, 'Definition list', 'definitionList', function(editor){
        // var newList = crel('dl', crel('dt'));
        
        // wrapTargetWith(newList, newList.childNodes[0]);            
    // });
    // editor.on('keydown', function(event){
        // var atCaret = $(getElementAtCaret());
        // if(atCaret.closest('dl').length && event.which === 9){ // tab
            // event.preventDefault();
            // if(atCaret.closest('dt').length){
                // var nextNode = atCaret.closest('dt').next();
                // if(!nextNode.length){
                    // atCaret.closest('dt').after(crel('dd', '(definition)'));
                // }
                // selectNode(atCaret.closest('dt').next()[0]);
            // }else{
                // var nextNode = atCaret.closest('dd').next();
                // if(!nextNode.length){
                    // atCaret.closest('dd').after(crel('dt',(title)'));
                // }
                // selectNode(atCaret.closest('dd').next()[0]);
            // }
        // }
    // });
    
    // addControl(editor, 'Link', 'anchor', function(editor){            
        // wrapTargetWith(crel('a', {'href':window.prompt("Enter the link URL")}));
    // });
    
    // delegated events.
    $(document).on('change cut copy paste drop', '.freditor .editArea', function(event){
        var editorElement = closest('.freditor', event.target),
            editor = editorElement.freditor;
            
        setTimeout(function(){
            editor.sanitise();
            editor.field.value = editor.editArea.innerHTML;
        },0);
    }).on('click', '.freditor .controls button', function(event){
        var button = $(event.target).closest('button'),
            operation = button.data('operation'),
            editorElement = button.closest('.freditor'),
            editor = editorElement[0].freditor;
        
            editor.performOperation(operation);
    }).on('keypress', '.freditor .editArea', function(event){
        var editorElement = closest('.freditor', event.target),
            editArea = editorElement.freditor.editArea;
        
        removeEmptyElements(editArea);
        
        $(editArea).trigger('change');
    }).on('select click keypress mouseup', '.freditor .editArea', function(event){
        var editorElement = closest('.freditor', event.target),
            editor = editorElement.freditor,
            editArea = editor.editArea;
            
        if($(getCommonSelectedNode()).closest(editArea).length){
            editor.selection = new Selection();
        }            
    });
    
    
    window.freditor = Freditor;
    
})(undefined);