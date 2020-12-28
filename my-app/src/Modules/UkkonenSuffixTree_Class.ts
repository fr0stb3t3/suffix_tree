class TreeNode {
	arr: Array<Branch>;
	type: string;
	link?: TreeNode;
    isRoot: boolean;
    getKey: (char: string) => number;
	constructor(getKey: (char: string) => number) {
		this.arr = new Array(27);
		this.type = "internal";
        this.isRoot = false;
        this.getKey = getKey;
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

class SuffixTree {
    root: TreeNode;
    END: Array<number>;
    text: string;
	constructor(text: string){
        this.text = text;
        this.END = [-1];
        
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
                    if (branch.node!.type == "leaf") {
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
    
        let current_branch: Branch = new Branch();
        let current_node: TreeNode;
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
                        prev_node_for_suffix_link.link = tuple.activeNode!;
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
                        let new_branch: Branch = new Branch();
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
                            let new_branch_with_old_data: Branch = new Branch();
                            let node_of_current_branch: TreeNode | Leaf = current_branch.node as TreeNode | Leaf;
    
                            new_branch_with_old_data.setBranchData(index_of_next_char_in_branch, current_branch_data_with_pointer[1])
                            new_branch_with_old_data.setNode(node_of_current_branch);
    
                            internal_node.addBranchAt(arr[index_of_next_char_in_branch], new_branch_with_old_data);
                            current_branch.setNode(internal_node);
                            current_branch.setBranchData(current_branch_data[0], [index_of_next_char_in_branch - 1])
    
                            let new_branch_with_new_data: Branch = new Branch();
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
                                prev_node.link = internal_node;
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
                    
                    // SHOWSTOPPER
                    break;
                }
                last_j = j;
    
                this.updateActiveNode(tuple, j + 1, arr)
    
                // current_branch = tuple.activeNode.getBranch(tuple.startingBranchCharacter!);
    
    
            }
    
            if (prev_node_for_suffix_link !== undefined) {
                prev_node_for_suffix_link!.link = root;
            }
    
        }
    
        return root;
    }
}

export default SuffixTree;
export {TreeNode};