

class UI
{

    constructor()
    {
        this.uiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.texts = null;
    }


    create()
    {
        this.texts = [];
    }


    add( type, content )
    {
        switch(type)
        {
            case "text":
                var textBlock = new BABYLON.GUI.TextBlock();
                this.initText( textBlock );
                this.setText( textBlock, content );
                this.uiTexture.addControl(textBlock);
                this.texts.push(textBlock);
                return textBlock;
        }
        return null;
    }


    modify( type, reference, content )
    {
        switch(type)
        {
            case "text":
                this.setText( reference, content );
                break;
        }
    }


    initText( reference )
    {
        reference.text = "default";
        reference.color = "#ffffff";
        reference.fontSize = 24;
        reference.fontWeight = "";
        reference.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        reference.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        reference.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        reference.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        reference.width = "100px";
        reference.height = "50px";
        reference.left = "0px";
        reference.top = "0px";
    }


    setText( reference, content )
    {
        reference.text = content.text || reference.text;
        reference.color = content.color || reference.color;
        reference.fontSize = content.size || reference.fontSize;
        reference.fontWeight = content.weight || reference.fontWeight;
        if (content.hAlign !== undefined)
        {
            reference.horizontalAlignment = content.hAlign;
            reference.textHorizontalAlignment = content.hAlign;
        }
        if (content.vAlign !== undefined)
        {
            reference.verticalAlignment = content.vAlign;
            reference.textVerticalAlignment = content.vAlign;
        }
        if (content.width !== undefined)
            reference.width = content.width + "px";
        if (content.height !== undefined)
            reference.height = content.height + "px";
        if (content.x !== undefined)
            reference.left = content.x + "px";
        if (content.y !== undefined)
            reference.top = content.y + "px";
    }

}