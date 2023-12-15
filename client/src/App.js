import React, { Component } from 'react';
import MyToken from './contracts/MyToken.json';
import MyTokenSale from './contracts/MyTokenSale.json';
import KycContract from './contracts/KycContract.json';
import MyMarketplace from './contracts/Marketplace.json';
import getWeb3 from './getWeb3';
import './App.css';
import { createProduct } from './api';

// Class Component
class App extends Component {
  // Khởi tạo state
  state = {
    // Trạng thái
    loaded: false,
    // Địa chỉ KYC mặc định là 0x123
    kycAddress: '0x123',
    // Địa chỉ Token Sale mặc định là chuỗi rỗng
    tokenSaleAddress: '',
    // Số lượng token của người dùng mặc định là 0
    userTokens: 0,
    // Tên sản phẩm chuỗi rỗng
    productName: '',
    // Giá sản phẩm chuỗi rồng
    productPrice: '',
    // Mảng chưa thông tin về sp mà component quản lý
    products: [],
  };

  componentDidMount = async () => {
    try {
      // Lấy provider của mạng và đối tượng web3
      this.web3 = await getWeb3();

      // Sử dụng web3 để lấy danh sách tài khoản người dùng
      this.accounts = await this.web3.eth.getAccounts();

      // Lấy ID mạng
      this.networkId = await this.web3.eth.net.getId();

      // In ra ID của mạng trong console để kiểm tra
      console.log(this.networkId);
      // Khởi tạo đối tượng contract cho MyToken, MyMarketplace, MyTokenSale, KycContract.
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

      // Lắng nghe sự kiện chuyển token
      this.listenToTokenTransfer();
      // Cập nhật trạng thái với web3, tài khoản và các contract, sau đó tiếp tục với ví dụ về
      // cách tương tác với các phương thức của contract.
      this.setState(
        { loaded: true, tokenSaleAddress: this.MyTokenSale._address },
        this.updateUserTokens
      );
      // Tải thông tin về sản phẩm
      this.loadProducts();
    } catch (error) {
      // Bắt lỗi cho bất kỳ lỗi nào xuất hiện trong quá trình thao tác
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
console.error(error);
    }
  };

  // Hàm để tải thông tin về sp trong smartcontract
  loadProducts = async () => {
    try {
      // Lấy số lượng sp từ smartcontract
      const productCount = await this.MyMarketplace.methods
        .getLengthProduct()
        .call();
      console.log('Product Count:', productCount);

      // Lặp qua từng sản phẩm và lấy thông tin chi tiết của nó
      for (let i = 0; i < productCount; i++) {
        // Gọi phương thức getProducts của smart contract để lấy thông tin sản phẩm tại vị trí i
        const product = await this.MyMarketplace.methods.getProducts(i).call();
        console.log('Product at index', i, ':', product);
        // Cập nhật mảng sản phẩm trong trạng thái của component
        this.setState({ products: [...this.state.products, product] });
      }
    } catch (error) {
      // Bắt lỗi nếu có vấn đề khi tải thông tin sản phẩm
      console.error('Error loading products:', error);
    }
    // In ra console mảng sản phẩm đã được cập nhật trong trạng thái của component
    console.log('Updated products array:', this.state.products);
  };

  // Hàm để xử lý tạo sản phẩm mới
  handleCreateProduct = async () => {
    // Lấy thông tin về tên và giá sản phẩm từ trạng thái của component
    const { productName, productPrice } = this.state;
    // Kiểm tra tính hợp lệ của giá sản phẩm
    if (!productPrice || isNaN(productPrice)) {
      console.error('Product price is not a valid number');
      return;
    }
    try {
      // Kiểm tra xem KYC của người dùng đã được hoàn thành chưa
      var isKycCompleted = await this.KycContract.methods
        .kycCompleted(this.accounts[0])
        .call();
      console.log('KYC Status:', isKycCompleted);
      // Nếu KYC chưa hoàn thành, thông báo và dừng lại
      if (isKycCompleted === false) {
        console.error('KYC verification required');
        return;
      }

      // handle create product
      await createProduct({ name: productName, price: productPrice });
      await this.loadProducts();

      // Log trạng thái trước khi thêm sản phẩm
      console.log('Before adding product. Account:', this.accounts[0]);

      // Gọi phương thức smart contract để thêm sản phẩm mới
      await this.MyMarketplace.methods
        .addProduct(productName, productPrice)
        .send({
          from: this.accounts[0],
        });

      // Cung cấp phản hồi cho người dùng
      // Đây có thể là nơi để thông báo cho người dùng biết rằng sản phẩm đã được thêm thành công
    } catch (error) {
      // Bắt lỗi nếu có vấn đề khi tạo sản phẩm

      console.error('Error creating product:', error);
      // Xử lý lỗi - bạn có thể muốn hiển thị một thông báo lỗi cho người dùng
    }
  };
// Hàm để tải dữ liệu từ blockchain, bao gồm thông tin về token và sản phẩm
  loadBlockchainData = () => {
    // Gọi hai hàm để cập nhật thông tin về token và sản phẩm
    this.updateUserTokens();
    this.loadProducts();
  };

  // Hàm để xử lý việc mua sản phẩm
  handlePurchaseProduct = async (productId) => {
    try {
      // Kiểm tra xem KYC của người dùng đã được hoàn thành chưa
      var isKycCompleted = await this.KycContract.methods
        .kycCompleted(this.accounts[0])
        .call();
      console.log('KYC Status:', isKycCompleted);
      // Nếu KYC chưa hoàn thành, thông báo và dừng lại
      if (isKycCompleted === false) {
        console.error('KYC verification required');
        return;
      }

      // Lấy thông tin về sản phẩm từ trạng thái của component
      const product = this.state.products[productId];

      // Kiểm tra xem người dùng có đủ token để mua sản phẩm hay không
      if (product.price > this.state.userTokens) {
        alert('Insufficient tokens');
        return;
      }

      // Thực hiện giao dịch để mua sản phẩm
      const approvalResult = await this.MyToken.methods
        .approve(this.MyMarketplace._address, product.price)
        .send({ from: this.accounts[0] });

      console.log('Approval Result:', approvalResult);
      console.log('Price:', product.price);
      console.log('Acc:', this.accounts[0]);
      console.log(this.MyMarketplace._address);

      // Kiểm tra xem người mua có phải là người bán hay không
      if (this.accounts[0] === product.seller) {
        alert('Owner is not buy');
        return;
      }
      // Mua sản phẩm sử dụng token đã được chấp thuận
      await this.MyMarketplace.methods
        .purchaseProduct(product.id)
        .send({ from: this.accounts[0] });

      // Tải lại thông tin về token và danh sách sản phẩm sau khi đã mua sản phẩm
    } catch (error) {
      // Bắt lỗi nếu có vấn đề khi mua sản phẩm
      alert('Error purchasing product:', error);
      // Xử lý lỗi - bạn có thể muốn hiển thị một thông báo lỗi cho người dùng
    }
  };

  // Hàm để cập nhật thông tin về số lượng token của người dùng
  updateUserTokens = async () => {
    // Gọi phương thức smart contract để lấy số lượng token của người dùng
    let userTokens = await this.MyToken.methods
      .balanceOf(this.accounts[0])
      .call();
    // Cập nhật trạng thái của component với số lượng token mới
    this.setState({ userTokens: userTokens });
  };
  // Hàm để lắng nghe sự kiện chuyển token và cập nhật số lượng token của người dùng khi có sự kiện xảy ra
  listenToTokenTransfer = async () => {
    // Sử dụng events của smart contract để lắng nghe sự kiện Transfer với địa chỉ người nhận là địa chỉ của người dùng
    this.MyToken.events
      .Transfer({ to: this.accounts[0] })
.on('data', this.updateUserTokens);
  };

  // Hàm để xử lý việc mua token
  handleBuyToken = async () => {
    // Gọi phương thức smart contract để mua token
    await this.MyTokenSale.methods
      .buyTokens(this.accounts[0])
      .send({ from: this.accounts[0], value: 1 });
  };

  // Hàm để xử lý sự kiện thay đổi giá trị của các trường nhập liệu trong form
  handleInputChange = (event) => {
    // Lấy thông tin từ sự kiện thay đổi giá trị
    const target = event.target;
    // Xác định giá trị dựa trên loại của trường nhập liệu
    const value = target.type === 'checkbox' ? target.checked : target.value;
    // Xác định tên của trường nhập liệu
    const name = target.name;
    // Cập nhật trạng thái của component với giá trị mới
    this.setState({
      [name]: value,
    });
  };
  // Hàm để xử lý việc gửi KYC và đánh dấu địa chỉ người dùng đã được xác minh
  handleKycSubmit = async () => {
    // Lấy địa chỉ KYC từ trạng thái của component
    const { kycAddress } = this.state;
    // Kiểm tra xem địa chỉ của smart contract KYC đã được thiết lập hay chưa
    if (this.KycContract._address) {
      // Gọi phương thức smart contract để đánh dấu địa chỉ người dùng đã được xác minh (KYC)
      await this.KycContract.methods
        .setKycCompleted(kycAddress)
        .send({ from: this.accounts[0] });
    } else {
      alert('KycContract address is not set.');
    }
    // Hiển thị thông báo xác nhận cho người dùng
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