class TreeNode {
	arr: Array<Branch>;
	type: string;
	link?: TreeNode;
    isRoot: boolean;
    getKey: (char: string) => number;

    suffixLinkFrom?: TreeNode; //This tells us which node has a suffix link TO this node. Example if A --> B, theb B.suffixLinkFrom = A
    // This is done for undoing a step and going back to prev step

    static lastName : string | null = null;
    name: string;

    //only useful when arr is an array instead of hashtable/dictionary, stores, which indics in arr have branches
    // example, if this node has two branches, one from letter 'a' and from letter 'c'. Then branchesWhere = [0,2]
    // doesnt need to be sorted. 
    branchesWhere: Array<number>;

    //this constructor has a get key function to make the array branch more flexible. 
    // one can replace it with a hashtable/dictionary instead of using an array. 
    // a different getKey function will be used for that
	constructor(getKey: (char: string) => number,) {
		this.arr = new Array(27);
		this.type = "internal";
        this.isRoot = false;
        
        this.branchesWhere = [];

        this.getKey = getKey;
        this.name = this.generateName();
        
 
	}

    generateName(): string {
        if (TreeNode.lastName === null){
            TreeNode.lastName = '_ROOT'
        }
        else if (TreeNode.lastName === '_ROOT'){
            TreeNode.lastName = 'A'
        }
        else{
            let ascii_val = TreeNode.lastName.charCodeAt(TreeNode.lastName.length-1);
            if (ascii_val === 'Z'.charCodeAt(0)){
                TreeNode.lastName += 'A';
            }
            else{
                let newChar = String.fromCharCode(++ascii_val);
                TreeNode.lastName = TreeNode.lastName.substr(0,TreeNode.lastName.length-1) + newChar;
            }
        }
        return TreeNode.lastName;
    }

	has(character: string): [boolean, Branch?] {
		let key_of_character: number = this.getKey(character);
		let b: Branch = this.arr[key_of_character];
		if (b === undefined) {
			return [false];
		}
		else {
			return [true, b];
		}
	}

	addBranchAt(character: string, branchToAdd: Branch) {
		let key_of_character: number = this.getKey(character);
        this.arr[key_of_character] = branchToAdd;
        
        this.branchesWhere.push(key_of_character);
	}

	getBranch(startingBranchCharacter: string): Branch {
		let key_of_character: number = this.getKey(startingBranchCharacter);
		return this.arr[key_of_character];
	}
}

class Leaf {
	type: string;
    number: number;

	constructor(leaf_number: number) {
		this.type = "leaf";
        this.number = leaf_number;
	}
}

class Branch {
	node?: TreeNode | Leaf;
	start_index?: number;
	end_index_pointer?: Array<number>; //always needs to be of type Array<Int>, so it can be consistent with GLOBAL_END

    // the name, parent_node and the contructor are irrelevant for the function of this algorithm but is vital when we need to draw it on html
    parent_node: TreeNode;

    constructor(parentNode: TreeNode){
        this.parent_node = parentNode;
    }
	setBranchData(_start_index: number, _end_index_pointer: Array<number>) {
		this.start_index = _start_index;
        this.end_index_pointer = _end_index_pointer;
	}

	incrementEndIndex() {
		if (this.end_index_pointer !== undefined) {
			this.end_index_pointer![0] += 1;
		}
		else {
			throw Error;
		}
	}
	getBranchData(): [number, number] {
		if (this.end_index_pointer !== undefined) {
			return [this.start_index!, this.end_index_pointer![0]];
		}
		else {
			throw Error;
		}
	}

	getBranchDataWithPointer(): [number, number[]] {
		return [this.start_index!, this.end_index_pointer!];
	}

	getBranchDepth(): number {
		return this.end_index_pointer![0] - this.start_index! + 1;
	}

	setNode(nodeToSet: TreeNode | Leaf) {
		this.node = nodeToSet;
	}
}


// This class tells us the location where the new character will be added
class Tuple {
	activeNode?: TreeNode;
	startingBranchCharacter?: string;
	depthInBranch?: number;
}

// This class will have details about a phase and extension during the construction of suffix Tree.
//A collection of these classes will be used in our implicit suffix tree to get the details of the tree during each phase and its extensions
class Trace{
    phase: number;
    extension: number;
    last_j: number;
    END: number;
    RULE: number;
    prev_node_name: string | undefined;

    activeNode: string;
    activeEdge: string;
    activeDepth: number;

    nodeMade?: TreeNode;

    constructor(phase: number, extension: number, last_j: number, END: number, RULE: number, prev_node_name: string | undefined, activePoint: Tuple){
        this.phase = phase;
        this.extension = extension;
        this.last_j = last_j;
        this.END = END;
        this.RULE = RULE;
        this.prev_node_name = prev_node_name;
        this.activeNode = activePoint.activeNode!.name;
        this.activeEdge = activePoint.startingBranchCharacter!;
        this.activeDepth = activePoint.depthInBranch! as number;
    }
}


class SuffixTree {
    root: TreeNode;
    END: Array<number>;
    text: string;

    stackTrace: Array<Trace>;

	constructor(text: string){
        this.text = text;
        this.END = [-1];
        this.stackTrace = [];
        this.root = this.implicitSuffixTree(text);
    }
    
    UPDATE_GLOBAL_END = (leaf_index: number) => { this.END[0] = leaf_index };

    INCREMENT_GLOBAL_END = () => { this.END[0]++ };

	getHead = () : TreeNode => {
		return this.root;
    }
    
    getKey = (chr: string): number => {
        if (chr !== '$') {
            return chr.charCodeAt(0) - 65;
        }
        else {
            return 26;
        }
    }

    isNextNodeReached = (branch: Branch, depthReached: number): Boolean => {

        if (branch.getBranchDepth() === depthReached) {
            return true;
        }
        else {
            return false;
        }
    }

    updateActiveNode = (tuple: Tuple, j: number, arr: Array<string>) => {
        if (tuple.depthInBranch! > 0) {
            if (tuple.activeNode?.isRoot) {
                tuple.depthInBranch! -= 1;
                tuple.startingBranchCharacter = arr[j];
            }
    
            tuple.activeNode = tuple.activeNode!.link!;
            let branchBeingReferredTo = tuple.activeNode.getBranch(tuple.startingBranchCharacter!);
            while (branchBeingReferredTo?.getBranchDepth() <= tuple.depthInBranch!) {
                tuple.activeNode = branchBeingReferredTo.node! as TreeNode;
                tuple.depthInBranch! -= branchBeingReferredTo.getBranchDepth();
                if (tuple.depthInBranch === 0) {
                    break;
                }
                else {
                    j += branchBeingReferredTo.getBranchDepth();
                    tuple.startingBranchCharacter = arr[j];
                }
                branchBeingReferredTo = tuple.activeNode.getBranch(tuple.startingBranchCharacter);
            }
        }
        else{
            tuple.activeNode = tuple.activeNode?.link!;
        }
    };

    printTree = () => {
        let rootNode = this.root;
        const aux_traverse = (node: TreeNode) => {
            for (let branch of node.arr) {
                if (branch !== undefined) {
                    console.log(`branch data for branch ${this.text[branch.start_index!]}`)
                    // console.log(branch.data)
                    console.log(this.text.substring(branch.start_index!, branch.end_index_pointer![0] + 1))
                    if (branch.node!.type === "leaf") {
                        console.log("reached leaf")
                    }
                    else {
                        console.log("diving into another node")
                        aux_traverse(branch.node! as TreeNode)
                    }
                }
            }
            console.log("traversed all branches for this node, going back")
        }
        console.log("diving into root array")
        aux_traverse(rootNode)
    }

    outputTrace = () => {
        console.table(this.stackTrace);
    }

    makeSuffixLink = (fromNode: TreeNode, toNode: TreeNode) =>{
        fromNode.link = toNode;
       
        if (!toNode.isRoot){
            toNode.suffixLinkFrom = fromNode;
        }
    }

    implicitSuffixTree = (str: string): TreeNode => {
        str = str.toUpperCase()
        let arr: Array<string> = str.split("")
    
        let root = new TreeNode(this.getKey)
        root.link = root;
        root.isRoot = true;

        let tuple: Tuple = new Tuple()
        tuple.activeNode = root
        tuple.depthInBranch = 0;
    
        let last_j: number = -1;
        let RULE: number = 3;
        let j: number;
    
        let current_node: TreeNode;
        let current_branch: Branch;
        let current_branch_data: Array<number>;
        let next_char_in_branch: string;
    
        let prev_node_for_suffix_link: TreeNode | undefined;
        
        //begin phase i
        for (let i = 0; i < arr.length; i++) {
             
            prev_node_for_suffix_link = undefined;
            current_node = tuple.activeNode as TreeNode;
            this.INCREMENT_GLOBAL_END() //Rapid Leaf Extension
            let char_to_add: string = arr[i];
    
            for (j = last_j + 1; j <= i; j++) {
                
                if (tuple.depthInBranch === 0) { // This should, if i am correct, always correspond to a case where a branch is yet to be selected from the node 
                    // I wrote the above comment a few months ago and I have no idea what it means now, lmao
                    // but this if statement is basically for
                    // when the tuple/active point points to a node, rather than a point in the branch
                    
                    /* let's say in the i-th phase of j extension, you create a new internal node, (lets call it unode) which is going to be linked to another internal node, (vnode)
                    now in the j+1th extension, either vnode has yet to be created or
                    vnode was already created in some previous extension
                    the following code takes care of the latter
                    this is so because, in the case of latter, the active point (tuple) WILL ALWAYS point to a Node, rather than a place in a branch
                    and it is that active node, which serves as vnode in our example.
                    */
                    if (prev_node_for_suffix_link !== undefined){
                        this.makeSuffixLink(prev_node_for_suffix_link , tuple.activeNode);

                        // delete the below commented code, if everything works lel
                        // prev_node_for_suffix_link.link = tuple.activeNode!;, 
                        prev_node_for_suffix_link = undefined;
                        
                    }
    
                    let boolean_and_branch = tuple.activeNode.has(char_to_add); //gives [true, branch] if branch exists otherwise [false]
                    
                    // if the node already has a branch starting with the character we have to add, (rule 3)
                    if (boolean_and_branch[0]) {
                        let thisBranch: Branch = boolean_and_branch[1] as Branch;
                        RULE = 3;
                        tuple.depthInBranch++;
                        if (this.isNextNodeReached(thisBranch, tuple.depthInBranch)) {
                            /*
                                this handles single character branches (example 
                                (root) -abbc-(node_u)- x -(node_v) - zzz... )
                                so if out tuple points at node_u and the character to insert is x, then
                                it checks if node_u has a branch with character x after it, therefore it points to the point right after -(node_u)-x
                                but that points to a node, therefore instead of (node_u, 'x', 1) our tuple becomes (node_v, 'doesnt matter whats here, 0)
                            */
                            tuple.activeNode = thisBranch.node! as TreeNode;
                            tuple.depthInBranch = 0; 
                        }
                        else {
                            tuple.startingBranchCharacter = char_to_add;
                            current_branch = thisBranch;
                        }
                    }
                    // else a new branch has to come out of that node (rule 2 without an internal node being created) 
                    else {
                        RULE = 2;
                        let new_branch: Branch = new Branch(tuple.activeNode!);
                        new_branch.node = new Leaf(j);
                        new_branch.setBranchData(i, this.END);
                        tuple.activeNode!.addBranchAt(char_to_add, new_branch);
                        current_branch = new_branch;
                        tuple.startingBranchCharacter = char_to_add;
                    }
                }
                else {
                    // if our tuple / active point points to a place in the branch
                    current_branch = tuple.activeNode.getBranch(tuple.startingBranchCharacter!);
                    current_branch_data = current_branch.getBranchData();
                    if (current_branch.getBranchDepth() > tuple.depthInBranch) {
                        let index_of_next_char_in_branch: number = current_branch_data[0] + tuple.depthInBranch;
                        next_char_in_branch = arr[index_of_next_char_in_branch];
                        if (char_to_add === next_char_in_branch) {
                            RULE = 3
                            // if (current_branch.getBranchDepth() === tuple.depthInBranch) 
                            if (this.isNextNodeReached(current_branch, tuple.depthInBranch))
                            {
                                if (current_branch.node!.type === "leaf") {
                                    // This block should never be executed either, this case should be covered by rapid leaf extension
                                    RULE = 1;
                                    current_branch.incrementEndIndex();
                                    tuple.depthInBranch++;
    
                                    console.log("This block should never be executed either, this case should be covered by rapid leaf extension");
                                    throw new Error("This block should never be executed either, this case should be covered by rapid leaf extension");
                                }
                                else {
    
                                    this.updateActiveNode(tuple, j, arr)
    
                                }
                            }
                            else {
                                tuple.depthInBranch++;
                            }
                        }
                        else {
                            RULE = 2
    
                            // make an internal node at this spot
                            let current_branch_data_with_pointer: [number, Array<number>] = current_branch.getBranchDataWithPointer();
                            let internal_node: TreeNode = new TreeNode(this.getKey);
                            let new_branch_with_old_data: Branch = new Branch(internal_node);
                            let node_of_current_branch: TreeNode | Leaf = current_branch.node as TreeNode | Leaf;
    
                            new_branch_with_old_data.setBranchData(index_of_next_char_in_branch, current_branch_data_with_pointer[1])
                            new_branch_with_old_data.setNode(node_of_current_branch);
    
                            internal_node.addBranchAt(arr[index_of_next_char_in_branch], new_branch_with_old_data);
                            current_branch.setNode(internal_node);
                            current_branch.setBranchData(current_branch_data[0], [index_of_next_char_in_branch - 1])
    
                            let new_branch_with_new_data: Branch = new Branch(internal_node);
                            new_branch_with_new_data.setBranchData(i, this.END);
                            let new_leaf_node_for_new_branch = new Leaf(j);
                            new_branch_with_new_data.setNode(new_leaf_node_for_new_branch);
                            internal_node.addBranchAt(char_to_add, new_branch_with_new_data);
    
                            //adding suffix link
                            //if a new node is made right now then it means, either it is the first internal node made in the current phase 
                            // basically j = last_j+1 or this is not the first internal node made in the current extension (i.e an internal node was made in the previous extension of the same phase)
                            // The former is already handled earlier, and the latter is handled in the following code.
                            // prev_node_for_suffix_link is the previous node made in the same extension.  
                            if (prev_node_for_suffix_link !== undefined){
                                let prev_node: TreeNode = prev_node_for_suffix_link as TreeNode;
                                this.makeSuffixLink(prev_node, internal_node);

                                // delete be;ow commented code if everything works well
                                // prev_node.link = internal_node;
                            }
                            
                            prev_node_for_suffix_link = internal_node;
                        }
                    }
                    else {
                        console.log("this shouldnt happen");
                        throw new Error("shouldnt happen");
                    }
                }
                
                if (RULE === 3) {
                    let _ = new Trace(i , j, last_j, this.END[0], RULE, prev_node_for_suffix_link?.name, tuple);
                    this.stackTrace.push(_);
                    // SHOWSTOPPER
                    break;
                }
                
                this.updateActiveNode(tuple, j + 1, arr)
                let _ = new Trace(i , j, last_j, this.END[0], RULE, prev_node_for_suffix_link?.name, tuple);
                _.nodeMade = prev_node_for_suffix_link;
                this.stackTrace.push(_);
                // current_branch = tuple.activeNode.getBranch(tuple.startingBranchCharacter!);
                
                last_j = j;
    
            }
    
            if (prev_node_for_suffix_link !== undefined) {

                this.makeSuffixLink(prev_node_for_suffix_link, root);

                //delete below commented code if nothign breaks
                // prev_node_for_suffix_link!.link = root;
            }
    
        }
    
        return root;
    }

}

export default SuffixTree;
export {TreeNode};