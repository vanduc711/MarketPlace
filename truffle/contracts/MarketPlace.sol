// SPDX-License-Identifier: MIT
pragma solidity >=0.6.1;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./KycContract.sol";
import "./MyToken.sol";

contract Marketplace is Ownable, KycContract {
    uint256 public productCounter;
    enum ProductStatus { Available, Sold, Shipped }

    event ProductAdded(
        uint256 productId,
        string name,
        uint256 priceInTokens,
        address seller
    );

    event ProductPurchased(
        uint256 productId,
        string name,
        uint256 priceInTokens,
        address buyer,
        address seller
    );

    struct Product {
        uint256 id;
        string name;
        uint256 price;
        address payable seller;
        address buyer;
        ProductStatus status;
    }
    mapping(uint256 => Product) public products;
    uint256[] private size;

    IERC20 public myToken;

    constructor(address _tokenAddress) {
        myToken = IERC20(_tokenAddress);
    }

    // modifier notSold(uint256 _productId) {
    //     require(!products[_productId].isSold, "Product already sold");
    //     _;
    // }

    modifier validPrice(uint256 _price) {
        require(_price > 0, "Price must be greater than zero");
        _;
    }


    function addProduct(string memory _name, uint256 _price) external {
        products[productCounter] = Product(
            productCounter,
            _name,
            _price,
            payable(msg.sender),
            address(0),
            ProductStatus.Available 
        );
        size.push(productCounter);
        emit ProductAdded(productCounter, _name, _price, msg.sender);
        productCounter++;
    }

    function purchaseProduct(uint256 _productId) external {

        products[_productId].buyer = msg.sender;
        uint256 price = products[_productId].price;
        // Ensure that the buyer has enough allowance to purchase the product
        require(
            myToken.allowance(msg.sender, address(this)) >= price,
            "Insufficient allowance for the buyer"
        );
        // Transfer tokens from the buyer to the seller
        myToken.transferFrom(products[_productId].buyer,products[_productId].seller, price);
        products[_productId].status = ProductStatus.Sold;
        

        // Emit the product purchase event
        emit ProductPurchased(
            _productId,
            products[_productId].name,
            price,
            products[_productId].buyer,
            products[_productId].seller
        );
    }

    function getProducts(uint256 _productId) public view returns(uint256 id,
        string memory name,
        uint256 price,
        address payable seller,
        address buyer,
        uint256 status){
        Product memory p = products[_productId];
        return(p.id,p.name,p.price,p.seller,p.buyer,uint256(p.status));
    }

    function getLengthProduct() public view returns(uint256){
        return size.length;
    }
}
