import React, {useEffect, useState} from "react";
import axios from "axios";
import {Table, Popconfirm, Button, Space, Form, Input} from "antd";
import {filter, isEmpty} from "lodash";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";

const DataTable = (props) => {
    const [gridData, setGridData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState("");
    const [sortedInfo, setSortedInfo] = useState({})
    const [editRow, setEdit] = useState(false);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState();
    const [searchColText, setSearchColText] = useState();
    const [searchedCol, setSearchedCol] = useState();

    let [filteredData] = useState();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () =>  {
      setLoading(true);
    //   const response = await axios.get("https://jsonplaceholder.typicode.com/comments");
      setGridData(props.gridData);
    //   const response = await axios.get("https://jsonplaceholder.typicode.com/comments");
    //   setGridData(response.data);
      setLoading(false);
    }

    const modifiedData = gridData.map(({body, ...item}) => ({
        ...item,
        key: item.id,
        comment: isEmpty(body) ? item.comment : body,
    })); 

    const handleDelete = (value) => {
        const dataSource = [...modifiedData];
        const filteredData = dataSource.filter(item => item.id !== value.id);
        setGridData(filteredData);
    }

    const handleSearchCol = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchColText(selectedKeys[0]);
        setSearchedCol(dataIndex)
    }

    const handleResetCol = (clearFilters) => {
        clearFilters();
        setSearchColText("");
    }


    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown:({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters
        }) => (
            <div style={{padding: 8}}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] :[])}
                    onPressEnter={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
                    style={{width: 188, marginBotton: 0, dispaly: "block"}}
                ></Input>
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined/>}
                        size="small"
                        style={{width: 90}}
                    >
                        Search
                    </Button>

                    <Button
                        onClick={() => handleResetCol(clearFilters)}
                        size="small"
                        style={{width: 90}}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),

        filterIcon: (filtered) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff': undefined }}/>
        ),
        onFilter: (value, record) => 
        record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : "",
        render: (text) => 
        searchedCol === dataIndex ? (
            <Highlighter
                highlightStyle={{backgroundColor: "#ffc069", padding:0 }}
                searchWords={[searchColText]}
                autoEscape
                textToHighlight={text ? text.toString() : ""}
                />
        ) : (text)
    })

    const edit = (record) => {
        form.setFieldsValue({
            name:"",
            email: "",
            comment:"",
            ...record
        })
        setEditingKey(record.key);
    }

    const cancel = () => {
        setEditingKey("");
    }

    const save = async (key) => {
        try {
            const row = await form.validateFields();
            const newData = [...modifiedData];
            const index= newData.findIndex((item) => key === item.key);
            if(index > -1) {
                const item = newData[index];
                newData.splice(index, 1, {...item, ...row});
                setGridData(newData);
                setEditingKey("");
            }
        }  catch(error) {
            console.log(error)
        }
    }

    const handleSearch = (e) => {
        setSearchText(e.target.value);
        if(e.target.value === "") {
            loadData();
        }

    }

    const globalSearch = () => {
        filteredData = modifiedData.filter((value)=> {
            return(
                value.name.toLowerCase().includes(searchText.toLowerCase()) ||
                value.email.toLowerCase().includes(searchText.toLowerCase()) ||
                value.comment.toLowerCase().includes(searchText.toLowerCase())
            )
        })
        setGridData(filteredData);
    }

    const handleChange = (...sorter) => {
        const {order, field} = sorter[2];
        setSortedInfo({columnKey: field, order});
    }

    const clearAll = () => {
        setSortedInfo({});
        setSearchText("");
        loadData();
    }

    const EditableCell  =({
        editing,
        dataIndex,
        title,
        record,
        children,
        ...restProps
    }) => {
        const input = <Input/>
        return (
            <td {...restProps}>
                {editing 
                    ? 
                        (<Form.Item
                                name={dataIndex}
                                style={{
                                    margin:0
                                }}
                                rules={[
                                    {
                                        required: true,
                                        message: `Please input ${title}`
                                    }
                                ]}
                            >
                                {input}
                            </Form.Item>
                        )
                    : (children)
                }
            </td>
        )
    };

    const columns = [
        {
            title: 'Id',
            dataIndex: "id"
        },
        {
            title: "Name",
            dataIndex: "name",
            align: "center",
            editable: true,
            sorter: (a,b) => a.name.length - b.name.length,
            sortOrder: sortedInfo.columnKey=== 'name' && sortedInfo.order,
            ...getColumnSearchProps("name"),
        },
        {
            title: "Email",
            dataIndex: "email",
            align: "center",
            editable: true,
            sorter: (a,b) => a.email.length - b.email.length,
            sortOrder: sortedInfo.columnKey=== 'email' && sortedInfo.order,
            ...getColumnSearchProps("email"),

        },
        {
            title: "Comment",
            dataIndex: "comment",
            align: "center",
            editable: true,
            sorter: (a,b) => a.comment.length - b.comment.length,
            sortOrder: sortedInfo.columnKey=== 'comment' && sortedInfo.order,
            ...getColumnSearchProps("comment"),
        },
        {
            title: "Actions",
            dataIndex: "actions",
            align: "center",
            render: (_, record) => {
                const editable = isEditing(record);

                return modifiedData.length >=1 
                ?   (
                        <Space size="middle">
                            <Popconfirm
                                title="Sure to delete?"
                                onConfirm={() => handleDelete(record)}
                            >
                                <Button type="primary" disabled={editable} danger>
                                    Delete
                                </Button>
                            </Popconfirm>
                            {editable 
                            ? (<span>
                                    <Space size="middle">
                                        <Button 
                                            onClick={(e) => save(record.key)}
                                            type="primary"
                                            style={{marginRight: 8}}
                                        >
                                            Save
                                        </Button>

                                        <Popconfirm
                                            title="Sure to cancel ?"
                                            onConfirm={cancel}
                                        >
                                            <Button>Cancel</Button>
                                        </Popconfirm>
                                    </Space>
                                </span>) 
                            : (
                                <Button
                                    onClick={()=>edit(record)}
                                    type="primary"
                                >
                                    Edit
                                </Button>
                            )}
                        </Space> 
                    ) 
                : null
            }
        }
    ]
    
    const isEditing = (record) => {
        return record.key === editingKey;
    }

    const mergedColumns = columns.map((col)=> {
        if (!col.editable) {
            return col;
        }
        return {
            ...col, 
            onCell: (record) => ({
                record,
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            })
        }
    })

    return(
        <div>
            <Space style={{marginBottom: 16}}> 
                <Input
                    placeholder="Enter search text"
                    onChange={handleSearch}
                    type="text"
                    allowClear
                    value={searchText}
                />
                <Button type="primary "onClick={globalSearch}>Search</Button>

                <Button onClick={clearAll}>Clear All</Button>
            </Space>
            <Form
                form={form}
                component={false}
            >
                <Table
                    components={{
                        body:{
                            cell: EditableCell,
                        }
                    }}
                    columns={mergedColumns}
                    dataSource={filteredData && filteredData.length ? filteredData : modifiedData}
                    bordered
                    loading={loading}
                    onChange={handleChange}
                />
            </Form>
        </div>
    )
}

export default DataTable;