interface NodesDictionary {
    [name: string] : VisualNode
}
let nodeDictionary: NodesDictionary = {};


class VisualNode{
    rightSibling: VisualNode | null;
    leftSibling:VisualNode | null;

    parentNode: VisualNode | null;
    arr: Array<VisualNode>;
    gridLevel: number;
    name: string;
    
    constructor( name: string, ParentNode: VisualNode | null = null){
        this.arr = [];
        this.parentNode = ParentNode;
        this.rightSibling = null;
        this.leftSibling = null;
        this.name = this.giveName(name);
        
        this.parentNode === null ? this.gridLevel = 0 : this.gridLevel = this.parentNode.gridLevel + 1;

        nodeDictionary[this.name] = this;

    }

    giveName = (name: string) : string => {
        if (nodeDictionary.hasOwnProperty(name)){
            throw new Error("this key already exists")
        }
        else{
            return name;
        }   
    }

    getLastChild = () : VisualNode | null => {
        if (this.arr.length === 0){
            return null
        }
        else{
            return this.arr[this.arr.length - 1];
        }
    }

    addToParentNode = () => {

        if (this.parentNode){
            let exLastChild = this.parentNode.getLastChild(); //by the next step, it wont be the last (or most recent) child of the parent node anymore
            this.parentNode!.arr.push(this);
            
            if (exLastChild){ //this if condition means, that this is the first child of the parent node
                
                if (exLastChild!.rightSibling !== null){
                    // this node is not the last node in the current ROW GRID
                    this.rightSibling = exLastChild.rightSibling;
                }
                exLastChild.rightSibling = this;
                this.leftSibling = exLastChild;
            }
            else{
                //check if parentNode is not the first Node in the grid row
                if (this.parentNode.leftSibling !== null){
                    

                    let parentNodeLeftSibling = this.parentNode.leftSibling;
                    let lastChildOf_ParentNodes_LeftSibling = parentNodeLeftSibling.getLastChild() 
                    if (lastChildOf_ParentNodes_LeftSibling !== null){
                        lastChildOf_ParentNodes_LeftSibling.rightSibling = this
                        this.leftSibling = lastChildOf_ParentNodes_LeftSibling;
                    }

                }
                
            }
        }
    }
}


interface GridElement{
    spacing: [number];
    linkedListHead: VisualNode;
    numNodes: number;
}


class GridHandler{
    //this class will only take care of how spacing is effected between nodes in the same level when a node is added to that row
    // this shouldn't handle parent-child or sibling-sibling relationship

    //BUT if you notice, it holds (The GridElement) a pointer to the head of a linked list (sibling - sibling node relationship within the same ROW)
    //because when the spacing changes, I need to use it to update the spacing of all those nodes in the same grid row

    grids: Array<GridElement>; 

    constructor(){
        this.grids = []
    }

    calculateSpacing(numberOfNodes: number) : number{
        return (100/(numberOfNodes + 1))
    }

    //VERY IMPORTANT, this method is designed so that all the nodes passed as argument BELONG IN THE SAME LEVEL (the same grid row);
    addNodesToGrid(nodes: [VisualNode]){
        let index = nodes[0].parentNode ? nodes[0].gridLevel+1 : 0; //this will only be false when adding rootNode (which means nodes = [root])

        if (index == this.grids.length){
            let gridElement: GridElement = {spacing: [this.calculateSpacing(nodes.length)] , linkedListHead: nodes[0], numNodes: nodes.length};
            this.grids.push(gridElement);
        }
        else if(index < this.grids.length){
            this.grids[index].numNodes += nodes.length;
            this.grids[index].spacing = [this.calculateSpacing(this.grids[index].numNodes)]
        }
        else{
            throw new Error('This shouldnt be possible');
        }

    }    
}

class VisualBranch{}

class TreeMaker{
    rootNode: VisualNode;
    gridHandler: GridHandler;

    constructor(){
        this.gridHandler = new GridHandler();

        this.rootNode = new VisualNode('root');
        this.gridHandler.addNodesToGrid([this.rootNode])
    }

    addChildNodeToParent = (childNodeName: string, parentNodeName: string) => {
        let parentNode : VisualNode = nodeDictionary[parentNodeName];
        let childNode = new VisualNode(childNodeName, parentNode);
    }

}

export {}
