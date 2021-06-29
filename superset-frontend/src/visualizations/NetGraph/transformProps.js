export default function transformProps(chartProps) {
    //前后端数据转换
        const {width, height, queryData, formData} = chartProps;
        // formData 前端页面表单的数据
        // queryData  后端返回的数据
        console.log(queryData)
        return {
            data: queryData.data,
            width,
            height,
            formData,
            nodes: queryData.data.nodes,
            links: queryData.data.links,
        };
    
    }