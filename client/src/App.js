import React, { Component } from "react";
import MyToken from "./contracts/MyToken.json";
import MyTokenSale from "./contracts/MyTokenSale.json";
import KycContract from "./contracts/KycContract.json";
import MyMarketplace from "./contracts/Marketplace.json";
import getWeb3 from "./getWeb3";

class App extends Component {
  state = {
    loaded: false,
    kycAddress: "0x123",
    tokenSaleAddress: "",
    userTokens: 0,
    productName: "",
    productPrice: "",
    products: []
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();

      console.log(this.networkId);

      this.MyToken = new this.web3.eth.Contract(
        MyToken.abi,
        MyToken.networks[this.networkId] && MyToken.networks[this.networkId].address
      );
      this.MyMarketplace = new this.web3.eth.Contract(
        MyMarketplace.abi,
        MyMarketplace.networks[this.networkId] && MyMarketplace.networks[this.networkId].address
      );

      this.MyTokenSale = new this.web3.eth.Contract(
        MyTokenSale.abi,
        MyTokenSale.networks[this.networkId] && MyTokenSale.networks[this.networkId].address
      );

      this.KycContract = new this.web3.eth.Contract(
        KycContract.abi,
        KycContract.networks[this.networkId] && KycContract.networks[this.networkId].address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenToTokenTransfer();
      this.loadProducts();
      this.setState({ loaded: true, tokenSaleAddress: this.MyTokenSale._address}, this.updateUserTokens)
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(`Failed to load web3, accounts, or contract. Check console for details.`);
      console.error(error);
    }
  }

  loadProducts = async () => {
    const productCount = await this.MyMarketplace.methods.getLengthProduct().call();

    for (let i = 0; i <= productCount; i++) {
      const product = await this.MyMarketplace.methods.getProducts(i).call();
      console.log(product.price)
      this.setState({products : [...this.state.products, product]})
    }

    console.log(this.state.products)
    console.log(productCount)
  }

  handleCreateProduct = async () => {
    const { productName, productPrice } = this.state;

    if (!productPrice || isNaN(productPrice)) {
      console.error("Product price is not a valid number");
      return;
    }

    try {
      var isKycCompleted = await this.KycContract.methods.kycCompleted(this.accounts[0]).call();
      console.log("KYC Status:", isKycCompleted);

      if (isKycCompleted === false) {
        console.error("KYC verification required");
        return;
      }

      // Indicate that the product creation is in progress

      // Log before calling the smart contract function
      console.log("Before adding product. Account:", this.accounts[0]);

      await this.MyMarketplace.methods.addProduct(productName, productPrice).send({
        from: this.accounts[0],
      });


      // Reload the products list after creating a new product
      this.loadProducts()

      // Provide user feedback
    } catch (error) {
      console.error("Error creating product:", error);
      // Handle error - you might want to display an error message to the user
    } 
  };


  handlePurchaseProduct = async (productId) => {
    try {
      var isKycCompleted = await this.KycContract.methods.kycCompleted(this.accounts[0]).call();
      console.log("KYC Status:", isKycCompleted);

      if (isKycCompleted === false) {
        console.error("KYC verification required");
        return;
      }

      const product = this.state.products[productId];

      // Check if the user has enough tokens to make the purchase
      if (product.price > this.state.userTokens) {
        console.error("Insufficient tokens");
        return;
      }

      // Make the transaction to purchase the product
      const approvalResult = await this.MyToken.methods
      .approve(this.MyMarketplace._address, product.price)
      .send({ from: this.accounts[0] });
  
      console.log("Approval Result:", approvalResult);
      console.log("Price:", product.price);
      console.log("Acc:", this.accounts[0]);
      console.log(this.MyMarketplace._address)
      // Purchase the product using the approved tokens
      await this.MyMarketplace.methods
        .purchaseProduct(product.id)
        .send({ from: this.accounts[0]});
        
      // Reload the user tokens and products list after purchasing the product
    } catch (error) {
      console.error("Error purchasing product:", error);
      // Handle error - you might want to display an error message to the user
    }
  };

  updateUserTokens = async () => {
    let userTokens = await this.MyToken.methods.balanceOf(this.accounts[0]).call();
    this.setState({ userTokens: userTokens });
  }

  listenToTokenTransfer = async () => {
    this.MyToken.events.Transfer({ to: this.accounts[0] }).on("data", this.updateUserTokens);
  }

  handleBuyToken = async () => {
    await this.MyTokenSale.methods.buyTokens(this.accounts[0]).send({ from: this.accounts[0], value: 1 });
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  handleKycSubmit = async () => {
    const { kycAddress } = this.state;
    if (this.KycContract._address) {

      await this.KycContract.methods.setKycCompleted(kycAddress).send({ from: this.accounts[0] });
    } else {

      console.error("KycContract address is not set.");
    }

    alert("Account " + kycAddress + " is now whitelisted");
  }
  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;

    }
    return (

      <div className="App" style={{ textAlign: "center", padding: "20px" }}>
        <h1>Capuccino Token for StarDucks</h1>

        <h2>Enable your account</h2>

        Address to allow: <input type="text" name="kycAddress" value={this.state.kycAddress} onChange={this.handleInputChange} />
        <button type="button" onClick={this.handleKycSubmit}>Add Address to Whitelist</button>

        <h2>Buy Token</h2>
        <p>If you want to buy token, send Wei to this address: {this.state.tokenSaleAddress}</p>
        <p>You have: {this.state.userTokens} CAPPU TOKEN</p>
        <button type="button" onClick={this.handleBuyToken}>Buy more tokens</button>

        <div>
          <h1>Marketplace</h1>
          <div>
            <h2>Create Product</h2>
            <div>
              <label>Name:</label>
              <input
                type="text"
                name="productName"
                value={this.state.productName}
                onChange={this.handleInputChange}
              />
            </div>
            <div>
              <label>Price (SCT):</label>
              <input
                type="text"
                name="productPrice"
                value={this.state.productPrice}
                onChange={this.handleInputChange}
              />
            </div>
            <button onClick={this.handleCreateProduct}>Create Product</button>
          </div>

          <div>
            <h2>Products List</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price (STC)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {this.state.products.map((product) => (
                  <tr key={product.id}>
                    {console.log(product.status)}
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.price} STC</td>
                    <td>{product.status === 1 ? 'Sold' : 'Available'}</td>
                    <td>
                      {product.status == 1 ? (
                        <span>Đã mua</span>
                      ) : (
                        <button onClick={() => this.handlePurchaseProduct(product.id)}>
                          Mua
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default App;