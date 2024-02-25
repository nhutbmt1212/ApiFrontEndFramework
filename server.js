const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mysql = require('mysql');
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
var nodemailer = require('nodemailer');
const post = 4000;
const jwtSecret = 'TruongMinhNhut';
var fs = require('fs');
const { basename } = require("path");
var corsOptions = {
    orgin: "http://localhost:4200/",
    optionsSuccessStatus: 200,
};


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'quanlyshopee'
});
app.use("/images", express.static('uploads'));
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Welcome to Express App")
})
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {

        let uniqueFilename = `${Date.now()}_${file.originalname}`;
        req.filename = uniqueFilename;
        cb(null, uniqueFilename);
    }

})

const upload = multer({ storage });
//upload 1 file ảnh
app.post("/file", upload.single("file"), (req, res) => {
    const file = req.file;
    if (file) {
        res.json(file);
    }
    else {
        throw new Error("File upload not found");
    }

});
//xóa ảnh 

//upload nhiều file ảnh
app.post("/multifiles", upload.array("files"), (req, res) => {
    const files = req.files;
    if (Array.isArray(files) && files.length > 0) {
        res.json(files);
    }
    else {
        throw new Error("File upload not found");
    }

})
//SẢN PHẨM
//lấy sản phẩm
app.get('/sanpham', (req, res) => {
    let sql = 'SELECT * FROM sanpham ORDER by NgayThem DESC';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
})
//thêm sản phẩm
app.post('/sanpham', (req, res) => {
    const newProduct = req.body;
    let sql = 'INSERT INTO SANPHAM SET ?';
    db.query(sql, newProduct, (err, result) => {
        if (err) throw err;
        res.send('Thêm sản phẩm thành công');
    })
})
//lấy sản phẩm theo id
app.get('/sanpham/:id', (req, res) => {
    let sql = 'SELECT * FROM SANPHAM WHERE MaSanPham = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
//sửa sản phẩm 
app.put('/sanpham/:id', (req, res) => {
    const productId = req.params.id;
    const updateProduct = req.body;
    let sql = 'UPDATE SANPHAM SET ? WHERE MaSanPham = ?';
    db.query(sql, [updateProduct, productId], (err, result) => {
        if (err) throw err;
        res.send('Update product successfully');
    });
});
//xóa sản phẩm
app.put('/xoasanpham/:id', (req, res) => {
    const productId = req.params.id;
    let sql = 'UPDATE sanpham SET TinhTrang ="Đã Xóa" where MaSanPham = ?'
    db.query(sql, productId, (err, result) => {
        if (err) throw err;
        res.send("Xóa sản phẩm thành công");
    })
})
//phân trang sp
app.get('/page/:id', (req, res) => {
    const page = req.params.id;
    const limit = 2;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM SANPHAM
    
      LIMIT ? OFFSET ?
    `;

    db.query(query, [limit, offset], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('An error occurred while querying the database');
        } else {
            res.json(results);
        }
    });
});

//DANH MỤC
//lấy danh mục
app.get('/danhmuc', (req, res) => {
    let sql = 'SELECT *FROM DANHMUCSANPHAM';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
})
//lấy danh mục theo id
app.get('/danhmuc/:id', (req, res) => {
    let sql = 'SELECT * FROM DANHMUCSANPHAM WHERE MaDanhMuc = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
app.post('/danhmuc', upload.single('file'), (req, res) => {
    let sql = 'INSERT INTO DANHMUCSANPHAM SET ?';

    if (!req.file) {
        res.status(400).json({ message: 'Không có file nào được gửi lên' });
        return;
    }

    const newCategory = {
        MaDanhMuc: req.body.MaDanhMuc,
        TenDanhMuc: req.body.TenDanhMuc,
        NgayThem: new Date(),
        TinhTrang: req.body.TinhTrang,
        MoTa: req.body.MoTa,
        HinhAnh: req.file.filename
    };

    db.query(sql, newCategory, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Có lỗi xảy ra' });
        } else {
            res.json({ message: 'Thêm danh mục thành công' });
        }
    });
});
//sửa danh mục
app.put('/danhmuc/:id', upload.single('file'), (req, res) => {
    let sql = 'UPDATE DANHMUCSANPHAM SET ? WHERE MaDanhMuc = ?';

    let updatedCategory = {
        MaDanhMuc: req.body.MaDanhMuc,
        TenDanhMuc: req.body.TenDanhMuc,
        NgayThem: new Date(),
        TinhTrang: req.body.TinhTrang,
        MoTa: req.body.MoTa,
    };

    if (req.file) {
        updatedCategory.HinhAnh = req.file.filename;
    }

    db.query(sql, [updatedCategory, req.params.id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Có lỗi xảy ra' });
        } else {
            res.json({ message: 'Cập nhật danh mục thành công' });
        }
    });

});
//xóa danh mục
app.put('/xoadanhmuc/:id', (req, res) => {
    let sql = 'UPDATE DANHMUCSANPHAM SET TinhTrang = "Đã xóa" WHERE MaDanhMuc = ?';

    db.query(sql, req.params.id, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Có lỗi xảy ra' });
        } else {
            res.json({ message: 'Đánh dấu danh mục như đã xóa thành công' });
        }
    });
});

//lấy hình ảnh đầu tiên của danh mục
app.get('/layhinhanhdanhmucdautien/:id', (req, res) => {
    const MaDanhMuc = req.params.id;

    let sql = `SELECT HinhAnh FROM DANHMUCSANPHAM where MaDanhMuc="${MaDanhMuc}" limit 1`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
})



//SẢN PHẨM HÌNH ẢNH
app.use("/layhinhanh", express.static('uploads'));

app.post('/hinhanh', upload.array('files'), (req, res) => {
    let sql = 'INSERT INTO SANPHAM_HINHANH SET ?';

    if (!req.files) {
        res.status(400).send('Không có file nào được gửi lên');
        return;
    }

    const MaSanPham = Array.isArray(req.body.MaSanPham) ? req.body.MaSanPham : [req.body.MaSanPham];

    const promises = req.files.map((file, index) => {
        return new Promise((resolve, reject) => {
            const newImage = {
                MaSanPham: MaSanPham[index],
                TenFileAnh: file.filename
            };

            db.query(sql, newImage, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    Promise.all(promises)
        .then(() => res.send('Thêm ảnh thành công'))
        .catch(err => {
            console.error(err);
            res.status(500).send('Có lỗi xảy ra');
        });
});

app.get('/hinhanh/:id', (req, res) => {
    let sql = 'SELECT * FROM SANPHAM_HINHANH WHERE MaSanPham = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

app.delete('/hinhanh/:id', (req, res) => {
    let ImageId = req.params.id;
    let getImageFromSql = `SELECT TenFileAnh FROM SANPHAM_HINHANH WHERE MaHinhAnh = ?`;
    db.query(getImageFromSql, [ImageId], (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            let fileName = result[0].TenFileAnh;
            fs.unlink(`./uploads/${fileName}`, function (err) {
                if (err && err.code == 'ENOENT') {
                    console.info("File doesn't exist, won't remove it.");
                } else if (err) {
                    console.error("Error occurred while trying to remove file");
                } else {
                    console.info(`removed`);
                }
            });

            let sql = 'DELETE FROM SANPHAM_HINHANH WHERE MaHinhAnh = ?';
            db.query(sql, [ImageId], (err, result) => {
                if (err) throw err;
                res.send('Image deleted successfully');
            });
        } else {
            res.send('No image found with the provided ID');
        }
    });
});

// lấy ảnh đầu tiên của một sản phẩm
app.get('/layhinhanhdautien/:id', (req, res) => {
    const MaSanPham = req.params.id;

    let sql = `SELECT TenFileAnh FROM sanpham_hinhanh where MaSanPham="${MaSanPham}" limit 1`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
})
//Lấy người dùng
//lấy hình ảnh đầu tiên của danh mục
app.get('/nguoidung', (req, res) => {

    let sql = `SELECT * FROM NGUOIDUNG`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
})
//lưu thông tin người dùng
app.put('/nguoidung/:id', (req, res) => {
    let sql = 'UPDATE NGUOIDUNG SET ? WHERE MaNguoiDung = ?';
    let updatedUser = {
        MaNguoiDung: req.body.MaNguoiDung,
        TenNguoiDung: req.body.TenNguoiDung,
        SoDienThoai: req.body.SoDienThoai,
        GioiTinh: req.body.GioiTinh,
        DiaChi: req.body.DiaChi,
        CCCD: req.body.CCCD
    }
    db.query(sql, [updatedUser, req.params.id], (err, result) => {
        if (err) {
            res.json({ message: false });
        }
        else {
            res.json({ message: true });
        }
    })
})
//thay đổi thông tin người dùng từ client
app.put('/clientthaynguoidung/:id', (req, res) => {
    let updatedUser = {};
    if (req.body.MaNguoiDung !== null) updatedUser.MaNguoiDung = req.body.MaNguoiDung;
    if (req.body.TenNguoiDung !== null) updatedUser.TenNguoiDung = req.body.TenNguoiDung;
    if (req.body.SoDienThoai !== null) updatedUser.SoDienThoai = req.body.SoDienThoai;
    if (req.body.GioiTinh !== null) updatedUser.GioiTinh = req.body.GioiTinh;
    if (req.body.DiaChi !== null) updatedUser.DiaChi = req.body.DiaChi;
    if (req.body.CCCD !== null) updatedUser.CCCD = req.body.CCCD;
    if (req.body.Email !== null) updatedUser.Email = req.body.Email;

    // Thêm các trường khác nếu cần

    if (req.body.MatKhau !== null) {
        bcrypt.hash(req.body.MatKhau, 10, function (err, hash) {
            if (err) {
                res.json({ message: false });
            } else {
                updatedUser.MatKhau = hash;
                let sql = 'UPDATE NGUOIDUNG SET ? WHERE MaNguoiDung = ?';
                db.query(sql, [updatedUser, req.params.id], (err, result) => {
                    if (err) {
                        res.json({ message: false });
                    }
                    else {
                        res.json({ message: true });
                    }
                })
            }
        })
    }
    else {
        let sql = 'UPDATE NGUOIDUNG SET ? WHERE MaNguoiDung = ?';
        db.query(sql, [updatedUser, req.params.id], (err, result) => {
            if (err) {
                res.json({ message: false });
            }
            else {
                res.json({ message: true });
            }
        })
    }
})
app.get('/laynguoidungtheoid/:id', (req, res) => {
    let sql = 'SELECT * FROM NGUOIDUNG WHERE MaNguoiDung = ?';
    db.query(sql, req.params.id, (err, result) => {
        if (err) console.error(err);
        else {
            res.send(result);
        }
    })
})
//kiểm tra trùng số điện thoại 
app.get('/checkTrungSDT/:sdt/:mnd', (req, res) => {
    const phoneNumber = req.params.sdt;
    const maNguoiDung = req.params.mnd;

    const sql = 'SELECT * FROM NGUOIDUNG WHERE SoDienThoai = ? AND MaNguoiDung != ? ';

    db.query(sql, [phoneNumber, maNguoiDung], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (result.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
});

app.get('/checkTrungCCCD/:cccd/:mnd', (req, res) => {
    const CCCD = req.params.cccd;
    const maNguoiDung = req.params.mnd;

    const sql = 'SELECT * FROM NGUOIDUNG WHERE CCCD = ? AND maNguoiDung != ? ';

    db.query(sql, [CCCD, maNguoiDung], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (result.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
});
app.get('/checkTrungEmail/:email/:mnd', (req, res) => {
    const Email = req.params.email;
    const maNguoiDung = req.params.mnd;

    const sql = 'SELECT * FROM NGUOIDUNG WHERE Email = ? AND maNguoiDung != ? ';

    db.query(sql, [Email, maNguoiDung], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (result.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
});

//login
app.post('/login', (req, res) => {
    const Email = req.body.Email;
    const MatKhau = req.body.MatKhau;
    db.query('SELECT * FROM NGUOIDUNG WHERE Email = ? ', [Email], async (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Server error');
        }
        if (!results || results.length === 0) {
            res.status(401).json({ message: 'Fail' });
        }
        else {

            // // Sử dụng hàm bcrypt.compare để so sánh mật khẩu
            bcrypt.compare(MatKhau, results[0].MatKhau, function (err, result) {
                if (result == true) {
                    console.log('đúng');
                    const id = results[0].id;
                    const token = jwt.sign({ id, results }, jwtSecret, {
                        expiresIn: '30d'
                    });
                    res.status(200).send({
                        MaNguoiDung: results[0].MaNguoiDung,
                        token
                    });
                } else {
                    console.log('sai');
                    res.status(401).json({ message: 'Fail' });
                }
            });
        }
    });
});

//mk email butu cvoy gbbk wmtl
//gửi mail
app.post('/send-email', async (req, res) => {
    let email = req.body.email;
    let OTP = req.body.verificationCode;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'nhutbmt82@gmail.com',
            pass: 'butu cvoy gbbk wmtl' // replace 'yourpassword' with your actual password
        }
    });

    let mailOptions = {
        from: 'nhutbmt82@gmail.com',
        to: email,
        subject: 'Xác nhận mật khẩu',
        html: `<!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .email-container {
                    width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                .email-header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #ddd;
                }
                .email-body {
                    margin-top: 20px;
                }
                .email-body button {
                    display: block;
                    margin: 0 auto;
                    height: 60px;
                    width: 160px;
                    font-size: 20px;
                    background-color: rgb(255, 80, 30);
                    border: 0;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h2>Thông báo từ Shopee Clone</h2>
                </div>
                <div class="email-body">
                    <p>Chúng tôi nhận thấy bạn vừa đăng ký tài khoản ở app chúng tôi</p>
                    <p>OTP của bạn là: ${OTP}</p>
                    
                </div>
            </div>
        </body>
        <script>
            function XacMinhEmail() {
                localStorage.setItem('XacMinhEmail', true);
            }
        </script>
        </html>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        res.json({ message: 'Email sent: ' + info.response });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error sending email' });
    }
});
//đăng ký tài khoản
app.post('/register', (req, res) => {
    let TaiKhoan = req.body;
    bcrypt.hash(TaiKhoan.MatKhau, 10, function (err, hash) {
        TaiKhoan.MatKhau = hash;
        console.log(TaiKhoan);
        let sql = 'INSERT INTO NGUOIDUNG SET ?';
        db.query(sql, TaiKhoan, (err, result) => {
            if (err) throw err;
            res.send('Đăng ký thành công');
        })
    })


})
//test mã hóa mật khẩu
app.get('/mahoa/:id', (req, res) => {
    const id = req.params.id;
    bcrypt.hash(id, 10, function (err, hash) {
        res.send(hash);
    })
})

//encode password
app.get('/giaima/:id', (req, res) => {
    const id = req.params.id;
    bcrypt.compare(id, "$2b$10$j2vJAK23RQXTHG5FvkMVCeMxe5JS.2D3RYUXgWfCfZAL.Rk2Q4btS", function (err, result) {
        res.send(result);
    })
})

app.listen(post, () => {
    console.log("Express app is running on localhost:" + post);
})