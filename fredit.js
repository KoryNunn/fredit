//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

;(function(){

    // https://github.com/KoryNunn/crel minified
    var crel = function(j){function g(a){return"object"===typeof Node?a instanceof Node:a&&"object"===typeof a&&"number"===typeof a.nodeType&&"string"===typeof a.nodeName}function e(){var a=window.document,b=arguments,c,d;if(1===arguments.length)return a.createElement(arguments[0]);b=k.slice.call(arguments);c=b.shift();d=b.shift();c=a.createElement(c);if(g(d)||"object"!==typeof d)b=[d].concat(b),d={};if(1===b.length&&"string"===typeof b[0]&&c.textContent!==j)c.textContent=b[0];else for(var h=0;h<b.length;h++)child=b[h],null!=child&&(g(child)||(child=a.createTextNode(child)),c.appendChild(child));for(var f in d)a=e.attrMap[f]||f,"function"===typeof a?a(c,d[f]):c.setAttribute(a,d[f]);return c}var k=[];e.attrMap={};e.isNode=g;return e}(),
        testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');    
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;

    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;
    
    function fastEach(array, callback) {
        for (var i = 0; i < array.length; i++) {
            if(callback(array[i], i, array)) break;
        }
        return array;
    }
    
    function contains(list, target){
        if(list == null){
            return false;
        }
        var result = false;
        fastEach(list, function(item){
            if(item === target){
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
    
    function getClosestElement(node){
        while(node && node.nodeType !== 1){
			node = node.parentNode;
		}
		
		return node;
    }
    
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
            if(this.originalSelection.rangeCount > index){
                return this.originalSelection.getRangeAt(index);            
            }
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
        return getCommonSelectedNode(this);
    };
    Selection.prototype.getCommonElement = function(){
        return getClosestElement(this.getCommonNode());
    };
    Selection.prototype.getNodeAtCaret = function(){
        if(this.isCaret()){
            return this.originalSelection.anchorNode;
        }
    };
    Selection.prototype.getElementAtCaret = function(){
        return getClosestElement(this.getNodeAtCaret());
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
        
        editArea.sanitiseChange = true;
        
        fastEach(find('script, style', editArea), function(element){
            element.parentNode.removeChild(this);
        });
        fastEach(find('*', editArea), function(element){
            element.removeAttribute('style');
        });
        
        replaceDivsWithParagraphs(editArea);
        removeEmptyElements(editArea);
        
        if(editArea.innerHTML !== editArea.innerHTML){
            editArea.innerHTML = editArea.innerHTML;
        }
        
        editArea.sanitiseChange = false;
    }
    
    function bindEvents(editor){
        var editorElement = editor.element,
            editArea = editor.editArea;
        // delegated events.
        $(editArea).on('DOMSubtreeModified', function(event){
            if(editArea.sanitiseChange){
                return;
            }
            
            // Run the following outside this event stack
            // so that the browser has time to update the 
            // location of the selection.
            setTimeout(function(){
                editor.sanitise();            
                $(editor.field).val(editArea.innerHTML);
                $(editArea).trigger('change');
            },0);
        })
        $(editorElement).on('click', '.controls button', function(event){
            var button = $(event.target).closest('button'),
                operation = button.data('operation');
                
                editor.performOperation(operation);
        })
        
        $(editArea).on('select click keyup keydown mouseup focus', function(event){
            if($(getCommonSelectedNode()).closest(editArea).length){
                editor.selection = new Selection();
            }            
        });
    }

    function Freditor(field, options){
        // clone operation collection.
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
        
        var editorElement = this.element = crel('div',{'class':'freditor'}),
            editArea = this.editArea = crel(options.editableElementType || 'div',{'class':'editArea', 'contenteditable':'true', 'tabindex':0}),
            controls = this.controls = createEditorControls();
        
        editorElement.freditor = this;
        editArea.contentEditable = true;
        
        editArea.innerHTML = field.value;
        
        $(field).on('change', function(){
            editArea.innerHTML = field.value;
        });
        
        appendChildren(editorElement, [controls, editArea]);
        
        bindEvents(this);
        
        
        if(field.parentNode){
            $(field).hide();
            field.parentNode.insertBefore(editorElement, field.nextSibling);
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
        if(this.selection && $(this.selection.getCommonElement()).closest(this.editArea).length){
            this.operations[operation].call(this);
        }
    };
    Freditor.prototype.setValue = function(value){
        this.editArea.innerHTML = value;
    };
    Freditor.prototype.getValue = function(){
        return this.editArea.innerHTML;
    };
    Freditor.prototype.enable = function(){
        this.editArea.contentEditable = true;
        this.controls.removeAttribute('style');
    };
    Freditor.prototype.disable = function(){
        this.editArea.contentEditable = false;
        this.controls.setAttribute('style','display:none;');
    };
    Freditor.crel = crel;
    
    window.freditor = Freditor;
    
})(undefined);