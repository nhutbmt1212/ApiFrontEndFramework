const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mysql = require('mysql');
const bodyParser = require("body-parser");



const app = express();
const post = 4000;
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

})
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
    let sql = 'SELECT *FROM SANPHAM';
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


//DANH MỤC
//lấy danh mục
app.get('/danhmuc', (req, res) => {
    let sql = 'SELECT *FROM DANHMUCSANPHAM';
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
    const ImageId = req.params.id;
    let sql = 'DELETE FROM SANPHAM_HINHANH WHERE MaHinhAnh = ?';
    db.query(sql, ImageId, (err, result) => {
        if (err) throw err;
        res.send('Image deleted successfully');
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


app.listen(post, () => {
    console.log("Express app is running on localhost:" + post);
})