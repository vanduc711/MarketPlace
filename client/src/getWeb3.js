import Web3 from "web3";

const getWeb3 = async () => {
  if (window.ethereum) {
    // Sử dụng Ethereum provider nếu trình duyệt hỗ trợ
    const web3 = new Web3(window.ethereum);
    try {
      // Yêu cầu quyền truy cập tài khoản
      await window.ethereum.enable();
      return web3;
    } catch (error) {
      throw new Error("User denied access to their accounts");
    }
  } else if (window.web3) {
    // Sử dụng trình duyệt cũ hơn có sẵn Web3
    return new Web3(window.web3.currentProvider);
  } else {
    // Trình duyệt không hỗ trợ Web3 hoặc không có trình duyệt
    throw new Error("No Web3 provider detected");
  }
};

export default getWeb3;
