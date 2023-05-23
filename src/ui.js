

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


    setText( reference, content )
    {
        reference.text = content.text;
        reference.color = content.color | "white";
        reference.fontSize = content.size | 36;
        reference.fontWeight = content.weight | "bold";
        reference.textHorizontalAlignment = content.hAlign | BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        reference.textVerticalAlignment = content.vAlign | BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        reference.left = content.x.toString() + "px";
        reference.top = content.y.toString() + "px";
        reference.width = content.width + "px";
        reference.height = content.height + "px";
    }

}