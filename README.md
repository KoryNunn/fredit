fredit
======

a friendly wysiwyg editor.

A basic wysiwyg editor leveraging contenteditable, that is simple and easy to extend.

Requires jQuery (for now)


Example:

    $(function(){
    
        // Make an editor
        var editor = new freditor();
        
        // Add the shipped controls (bold, underline, italics...)
        editor.addDefaultControls();
        
        // Add a pointless custom control
        editor.addControl('Thing', 'thing', function(){
            alert('I do nothing! :D');
        });
        
        // Shuv it in the page.
        $('body').append(editor.element);
    });
