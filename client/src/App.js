import React, { Component } from 'react';
import MyToken from './contracts/MyToken.json';
import MyTokenSale from './contracts/MyTokenSale.json';
import KycContract from './contracts/KycContract.json';
import MyMarketplace from './contracts/Marketplace.json';
import getWeb3 from './getWeb3';
import './App.css';
import { createProduct } from './api';

class App extends Component {
  // Khởi tạo state
  state = {
    loaded: false,
    kycAddress: '0x123',
    tokenSaleAddress: '',
    userTokens: 0,
    productName: '',
    productPrice: '',
    products: [],
  };

  componentDidMount = async () => {
    try {
      this.web3 = await getWeb3();

      this.accounts = await this.web3.eth.getAccounts();

      this.networkId = await this.web3.eth.net.getId();

      console.log(this.networkId);
      
      this.MyToken = new this.web3.eth.Contract(
        MyToken.abi,
        MyToken.networks[this.networkId] &&
          MyToken.networks[this.networkId].address
      );
      this.MyMarketplace = new this.web3.eth.Contract(
        MyMarketplace.abi,
        MyMarketplace.networks[this.networkId] &&
          MyMarketplace.networks[this.networkId].address
      );

      this.MyTokenSale = new this.web3.eth.Contract(
        MyTokenSale.abi,
        MyTokenSale.networks[this.networkId] &&
          MyTokenSale.networks[this.networkId].address
      );

      this.KycContract = new this.web3.eth.Contract(
        KycContract.abi,
        KycContract.networks[this.networkId] &&
          KycContract.networks[this.networkId].address
      );

      this.listenToTokenTransfer();
      
      this.setState(
        { loaded: true, tokenSaleAddress: this.MyTokenSale._address },
        this.updateUserTokens
      );
      this.loadProducts();
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
console.error(error);
    }
  };

  loadProducts = async () => {
    try {
      const productCount = await this.MyMarketplace.methods
        .getLengthProduct()
        .call();
      console.log('Product Count:', productCount);
      for (let i = 0; i < productCount; i++) {
       
        const product = await this.MyMarketplace.methods.getProducts(i).call();
        console.log('Product at index', i, ':', product);
        this.setState({ products: [...this.state.products, product] });
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
    console.log('Updated products array:', this.state.products);
  };

  handleCreateProduct = async () => {
    const { productName, productPrice } = this.state;
    if (!productPrice || isNaN(productPrice)) {
      console.error('Product price is not a valid number');
      return;
    }
    try {
      var isKycCompleted = await this.KycContract.methods
        .kycCompleted(this.accounts[0])
        .call();
      console.log('KYC Status:', isKycCompleted);
    
      if (isKycCompleted === false) {
        console.error('KYC verification required');
        return;
      }

      // handle create product
      await createProduct({ name: productName, price: productPrice });
      await this.loadProducts();
      console.log('Before adding product. Account:', this.accounts[0]);

      await this.MyMarketplace.methods
        .addProduct(productName, productPrice)
        .send({
          from: this.accounts[0],
        });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  loadBlockchainData = () => {
    this.updateUserTokens();
    this.loadProducts();
  };

  handlePurchaseProduct = async (productId) => {
    try {
      var isKycCompleted = await this.KycContract.methods
        .kycCompleted(this.accounts[0])
        .call();
      console.log('KYC Status:', isKycCompleted);
  
      if (isKycCompleted === false) {
        console.error('KYC verification required');
        return;
      }

      const product = this.state.products[productId];

      if (product.price > this.state.userTokens) {
        alert('Insufficient tokens');
        return;
      }

      const approvalResult = await this.MyToken.methods
        .approve(this.MyMarketplace._address, product.price)
        .send({ from: this.accounts[0] });

      if (this.accounts[0] === product.seller) {
        alert('Owner is not buy');
        return;
      }
      await this.MyMarketplace.methods
        .purchaseProduct(product.id)
        .send({ from: this.accounts[0] });

    } catch (error) {
      alert('Error purchasing product:', error);
    }
  };

  
  updateUserTokens = async () => {
    
    let userTokens = await this.MyToken.methods
      .balanceOf(this.accounts[0])
      .call();
  
    this.setState({ userTokens: userTokens });
  };
  
  listenToTokenTransfer = async () => {
    
    this.MyToken.events
      .Transfer({ to: this.accounts[0] })
.on('data', this.updateUserTokens);
  };

 
  handleBuyToken = async () => {
    
    await this.MyTokenSale.methods
      .buyTokens(this.accounts[0])
      .send({ from: this.accounts[0], value: 1 });
  };

  handleInputChange = (event) => {
  
    const target = event.target;
    
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    const name = target.name;
    
    this.setState({
      [name]: value,
    });
  };
 
  handleKycSubmit = async () => {
    
    
    if (this.KycContract._address) {
      
      await this.KycContract.methods
        .setKycCompleted(kycAddress)
        .send({ from: this.accounts[0] });
    } else {
      alert('KycContract address is not set.');
    }
    alert('Account ' + kycAddress + ' is now whitelisted');
  };
  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className='container'>
        <h1 className='header'>Capuccino Token for StarDucks</h1>
        <div className='card' style={{ textAlign: 'center' }}>
          <h2>Enable your account</h2>
          Address to allow:{' '}
          <input
            type='text'
            name='kycAddress'
            value={this.state.kycAddress}
            onChange={this.handleInputChange}
          />
          <button
            className='btn'
            type='button'
            onClick={this.handleKycSubmit}
            style={{ marginLeft: '10px', backgroundColor: '#4caf50' }}
          >
            Add Address to Whitelist
          </button>
          <h2>Buy Token</h2>
          <p>
            If you want to buy token, send Wei to this address:{' '}
            {this.state.tokenSaleAddress}
          </p>
          <p>You have: {this.state.userTokens} CAPPU TOKEN</p>
          <button
            className='btn'
            type='button'
            style={{ backgroundColor: '#4caf50' }}
            onClick={this.handleBuyToken}
          >
            Buy more tokens
          </button>
        </div>
        <div className='card' style={{ textAlign: 'center' }}>
          <h2>Marketplace</h2>
<div>
            <h2 style={{ margin: '10px 0px' }}>Create Product</h2>
            <div className='input' style={{ paddingLeft: '200px' }}>
              <div>
                <label>Name:</label>
                <input
                  type='text'
                  name='productName'
                  value={this.state.productName}
                  onChange={this.handleInputChange}
                />
              </div>
              <div style={{ marginLeft: '10px' }}>
                <label>Price (SCT):</label>
                <input
                  type='text'
                  name='productPrice'
                  value={this.state.productPrice}
                  onChange={this.handleInputChange}
                />
              </div>
            </div>
            <button
              className='btn'
              style={{ backgroundColor: '#4caf50' }}
              onClick={this.handleCreateProduct}
            >
              Thêm sản phẩm mới
            </button>
          </div>

          <div>
            <h2 style={{ margin: '15px 0px', marginTop: '20px' }}>
              Danh Sách sản phẩm
            </h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Giá (STC)</th>
                  <th>Chủ sở hữu </th>
                  <th>Trạng thái</th>
                  <th>Dịch vụ</th>

                </tr>
              </thead>
              <tbody>
                {this.state.products.map((product) => (
                  <tr key={product.id}>
                    {console.log(product.status)}
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.price} STC</td>
                    <td>{product.status == 1 ? product.buyer : product.seller}</td>
                    <td>{product.status == 1 ? 'Sold' : 'Available'}</td>
                    <td>
                      {product.status == 1 ? (
                        <span>Purchased</span>
                      ) : (
                        <button
                          onClick={() => this.handlePurchaseProduct(product.id)}
                        >
                          Purchase
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
