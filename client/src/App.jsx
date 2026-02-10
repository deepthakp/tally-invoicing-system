import { useState, useEffect, useMemo } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Title,
  Text,
  TextInput,
  NumberInput,
  Button,
  Select,
  Table,
  Stack,
  Paper,
  Grid,
  ThemeIcon,
  ActionIcon,
  Badge,
  Container,
  Card,
  SimpleGrid,
  Modal
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconBuildingStore,
  IconPackage,
  IconFileInvoice,
  IconDashboard,
  IconPlus,
  IconSearch,
  IconTrash,
  IconReceipt2,
  IconDownload
} from '@tabler/icons-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Set the base URL for API requests
// In production (Vercel), VITE_API_URL should point to your backend deployed URL.
// In development, it falls back to localhost:3000 (which bypasses Vite proxy but works with CORS).
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- Utility: Currency Formatter ---
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Fetch data
  const fetchData = async () => {
    try {
      const [c, p, i] = await Promise.all([
        axios.get('/api/companies').then(res => res.data).catch(() => []),
        axios.get('/api/products').then(res => res.data).catch(() => []),
        axios.get('/api/invoices').then(res => res.data).catch(() => [])
      ]);
      setCompanies(c);
      setProducts(p);
      setInvoices(i);
    } catch (err) {
      console.error(err);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch data from server',
        color: 'red'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'invoices', label: 'Invoices', icon: IconFileInvoice },
    { id: 'companies', label: 'Companies', icon: IconBuildingStore },
    { id: 'products', label: 'Products', icon: IconPackage },
  ];

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="xl"
      bg="#F6F8FB"
    >
      <AppShell.Header bg="white" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <Group h="100%" px="xl" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <ThemeIcon size={36} radius="md" color="indigo" variant="filled">
              <IconReceipt2 size={24} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={3} c="indigo.8" style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>InvoicePro</Title>
              <Text size="xs" c="dimmed" fw={500}>Financial Management</Text>
            </Stack>
          </Group>
          {/* Header Actions / Profile Placeholder */}
          <Group visibleFrom="sm">
            <Button variant="subtle" color="gray">Support</Button>
            <ThemeIcon radius="xl" size="lg" variant="light" color="gray">
              <Text size="sm" fw={700}>JD</Text>
            </ThemeIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="#1C2C5B" style={{ borderRight: 'none' }}>
        <Stack gap="sm" mt="md">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant="subtle"
                color="gray"
                justify="flex-start"
                leftSection={<item.icon size={22} color={isActive ? '#1ABC9C' : '#A0AEC0'} />}
                onClick={() => { setActiveTab(item.id); toggle(); }}
                fullWidth
                styles={{
                  root: {
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: isActive ? 'white' : '#A0AEC0',
                    borderLeft: isActive ? '3px solid #1ABC9C' : '3px solid transparent',
                    borderRadius: '4px', // slightly less rounded for sidebar
                    height: '42px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white'
                    },
                  },
                  inner: { justifyContent: 'flex-start' },
                  label: { fontWeight: isActive ? 600 : 500, fontSize: '15px' }
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>
        <Stack mt="auto" mb="md" px="xs">
          <Paper p="sm" bg="rgba(0,0,0,0.2)" radius="md">
            <Group>
              <ThemeIcon variant="light" color="teal" size="md" radius="xl">
                <Text size="xs" fw={700}>P</Text>
              </ThemeIcon>
              <div>
                <Text size="xs" c="white" fw={600}>Pro Plan</Text>
                <Text size="xs" c="dimmed">Expires in 12 days</Text>
              </div>
            </Group>
          </Paper>
          <Text size="xs" c="dimmed" ta="center" mt="xs">v1.2.0 • InvoicePro</Text>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
          {activeTab === 'dashboard' && <DashboardView invoices={invoices} products={products} companies={companies} />}
          {activeTab === 'companies' && <CompaniesView companies={companies} refresh={fetchData} />}
          {activeTab === 'products' && <ProductsView products={products} refresh={fetchData} />}
          {activeTab === 'invoices' && <InvoicesView invoices={invoices} companies={companies} products={products} refresh={fetchData} />}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

// --- Views ---

function DashboardView({ invoices, products, companies }) {
  const stats = [
    { title: 'Total Revenue', value: formatCurrency(invoices.reduce((acc, curr) => acc + Number(curr.total_price), 0)), icon: IconReceipt2, color: 'teal', trend: '+12% this month' },
    { title: 'Total Invoices', value: invoices.length, icon: IconFileInvoice, color: 'blue', trend: '+5 this week' },
    { title: 'Active Products', value: products.length, icon: IconPackage, color: 'indigo', trend: 'Catalog growing' },
    { title: 'Clients', value: companies.length, icon: IconBuildingStore, color: 'grape', trend: 'Active partners' },
  ];

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} fw={800} c="indigo.9" style={{ letterSpacing: '-0.5px' }}>Dashboard</Title>
        <Text c="dimmed" size="lg">Overview of your financial performance.</Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {stats.map((stat) => (
          <Paper key={stat.title} p="lg" radius="md" shadow="sm" withBorder style={{ borderColor: '#E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Group justify="space-between" align="flex-start" mb="xs">
              <Text c="dimmed" size="xs" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>{stat.title}</Text>
              <ThemeIcon color={stat.color} variant="light" size="lg" radius="md">
                <stat.icon size={18} />
              </ThemeIcon>
            </Group>

            <div>
              <Text fw={700} size="2rem" c="indigo.9" style={{ lineHeight: 1 }}>{stat.value}</Text>
              <Badge
                variant="light"
                color={stat.color}
                mt="sm"
                size="sm"
                radius="sm"
                styles={{ root: { textTransform: 'none' } }}
              >
                {stat.trend}
              </Badge>
            </div>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper p="xl" radius="md" shadow="sm" withBorder style={{ borderColor: '#E5E7EB' }}>
        <Group justify="space-between" mb="lg">
          <Title order={4} c="indigo.9">Recent Transactions</Title>
          <Button variant="subtle" color="indigo" size="xs">View All</Button>
        </Group>
        <InvoiceList invoices={invoices.slice(0, 5)} simple />
      </Paper>
    </Stack>
  );
}

function CompaniesView({ companies, refresh }) {
  return (
    <Stack gap="xl">
      <div>
        <Title order={2} c="indigo.9">Companies</Title>
        <Text c="dimmed">Manage your client database.</Text>
      </div>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <CompanyForm onSuccess={refresh} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="xl" radius="md" shadow="sm" withBorder style={{ borderColor: '#E5E7EB' }}>
            <Title order={4} mb="lg" c="indigo.9">Company Directory</Title>
            <Table.ScrollContainer minWidth={500}>
              <Table striped highlightOnHover verticalSpacing="md" withTableBorder={false}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ color: '#6B7280' }}>ID</Table.Th>
                    <Table.Th style={{ color: '#6B7280' }}>Name</Table.Th>
                    <Table.Th style={{ color: '#6B7280' }}>Address</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {companies.map(c => (
                    <Table.Tr key={c.id}>
                      <Table.Td>{c.id}</Table.Td>
                      <Table.Td fw={600} c="indigo.9">{c.name}</Table.Td>
                      <Table.Td c="dimmed">{c.address}</Table.Td>
                    </Table.Tr>
                  ))}
                  {companies.length === 0 && <Table.Tr><Table.Td colSpan={3} ta="center" py="md" c="dimmed">No companies found</Table.Td></Table.Tr>}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

function ProductsView({ products, refresh }) {
  return (
    <Stack gap="xl">
      <div>
        <Title order={2} c="indigo.9">Products</Title>
        <Text c="dimmed">Manage your product catalog.</Text>
      </div>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ProductForm onSuccess={refresh} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="xl" radius="md" shadow="sm" withBorder style={{ borderColor: '#E5E7EB' }}>
            <Title order={4} mb="lg" c="indigo.9">Product Catalog</Title>
            <Table.ScrollContainer minWidth={500}>
              <Table striped highlightOnHover verticalSpacing="md" withTableBorder={false}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ color: '#6B7280' }}>Name</Table.Th>
                    <Table.Th style={{ color: '#6B7280' }}>Unit Price</Table.Th>
                    <Table.Th style={{ color: '#6B7280' }}>VAT %</Table.Th>
                    <Table.Th style={{ color: '#6B7280' }}>Stock</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {products.map(p => (
                    <Table.Tr key={p.id}>
                      <Table.Td fw={600} c="indigo.9">{p.name}</Table.Td>
                      <Table.Td>{formatCurrency(Number(p.unit_price))}</Table.Td>
                      <Table.Td>{p.vat_rate}%</Table.Td>
                      <Table.Td>{p.quantity_in_stock}</Table.Td>
                    </Table.Tr>
                  ))}
                  {products.length === 0 && <Table.Tr><Table.Td colSpan={4} ta="center" py="md" c="dimmed">No products found</Table.Td></Table.Tr>}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

function InvoicesView({ invoices, companies, products, refresh }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} c="indigo.9">Invoices</Title>
          <Text c="dimmed">Manage and create client invoices.</Text>
        </div>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={open}
          color="indigo"
          size="md"
          radius="md"
          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
        >
          Create Invoice
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={700} size="lg" c="indigo.9">New Invoice</Text>}
        size="lg"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        radius="md"
      >
        <OrderForm
          companies={companies}
          products={products}
          onSuccess={() => { refresh(); close(); }}
        />
      </Modal>

      <Paper p="xl" radius="md" shadow="sm" withBorder style={{ borderColor: '#E5E7EB' }}>
        <InvoiceList invoices={invoices} />
      </Paper>
    </Stack>
  );
}

// --- Components ---

function InvoiceList({ invoices, simple = false }) {
  if (!invoices || invoices.length === 0) {
    return <Text c="dimmed" ta="center" py="xl">No invoices found. Create your first one!</Text>;
  }

  // Download all invoices as a list
  const downloadReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Invoice Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

      const tableColumn = ["ID", "Date", "Company", "Product", "Qty", "VAT", "Total"];
      const tableRows = [];

      invoices.forEach(inv => {
        const invoiceData = [
          inv.id,
          new Date(inv.order_date).toLocaleDateString(),
          inv.company_name,
          inv.product_name,
          inv.quantity,
          formatCurrency(Number(inv.vat_amount)),
          formatCurrency(Number(inv.total_price))
        ];
        tableRows.push(invoiceData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [28, 44, 91] } // Deep indigo for PDF header
      });

      doc.save('tally_invoice_report.pdf');
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Failed to generate report', color: 'red' });
    }
  };

  // Download a single invoice
  const downloadSingleInvoice = (inv) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(28, 44, 91); // Deep Indigo
      doc.text('TAX INVOICE', 105, 20, null, null, 'center');

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Invoice #: INV-${inv.id}`, 14, 30);
      doc.text(`Date: ${new Date(inv.order_date).toLocaleDateString()}`, 14, 36);

      // Bill To
      doc.setFontSize(12);
      doc.setTextColor(28, 44, 91);
      doc.text('Bill To:', 14, 50);
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(inv.company_name, 14, 56);
      if (inv.company_address) {
        const splitAddress = doc.splitTextToSize(inv.company_address, 80);
        doc.text(splitAddress, 14, 62);
      }

      // Table Content
      const tableColumn = ["Item Description", "Qty", "Unit Price", "VAT Rate", "VAT Amount", "Total"];
      const tableRows = [[
        inv.product_name,
        inv.quantity,
        formatCurrency(Number(inv.unit_price)),
        `${inv.vat_rate}%`,
        formatCurrency(Number(inv.vat_amount)),
        formatCurrency(Number(inv.total_price))
      ]];

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'grid',
        headStyles: { fillColor: [28, 44, 91] } // Deep Indigo
      });

      // Totals
      const finalY = doc.lastAutoTable.finalY || 100;
      doc.setFontSize(12);
      doc.text(`Grand Total: ${formatCurrency(Number(inv.total_price))}`, 140, finalY + 20, { align: 'left' });

      doc.save(`Invoice_${inv.id}.pdf`);
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Error', message: 'Failed to download PDF', color: 'red' });
    }
  };

  return (
    <Stack>
      {!simple && (
        <Group justify="flex-end">
          <Button variant="light" color="indigo" size="xs" radius="md" onClick={downloadReport} leftSection={<IconDownload size={16} />}>
            Download Report
          </Button>
        </Group>
      )}
      <Table.ScrollContainer minWidth={simple ? 0 : 800}>
        <Table striped highlightOnHover verticalSpacing="sm" withTableBorder={false}>
          <Table.Thead bg="gray.0">
            <Table.Tr>
              <Table.Th style={{ color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</Table.Th>
              <Table.Th style={{ color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</Table.Th>
              <Table.Th style={{ color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</Table.Th>
              <Table.Th style={{ color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</Table.Th>
              {!simple && <Table.Th style={{ color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</Table.Th>}
              {!simple && <Table.Th style={{ color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VAT</Table.Th>}
              <Table.Th style={{ color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</Table.Th>
              {!simple && <Table.Th></Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invoices.map((inv) => (
              <Table.Tr key={inv.id} style={{ transition: 'background-color 0.2s' }}>
                <Table.Td>
                  <Text size="sm" fw={500} c="dimmed">#{inv.id}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{new Date(inv.order_date).toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} c="indigo.9">{inv.company_name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="dot" color="gray" size="sm" radius="sm">{inv.product_name}</Badge>
                </Table.Td>
                {!simple && <Table.Td><Text size="sm">{inv.quantity}</Text></Table.Td>}
                {!simple && <Table.Td><Text size="sm" c="dimmed">{formatCurrency(Number(inv.vat_amount))}</Text></Table.Td>}
                <Table.Td>
                  <Text fw={700} c="teal.7" size="sm">{formatCurrency(Number(inv.total_price))}</Text>
                </Table.Td>
                {!simple && (
                  <Table.Td>
                    <ActionIcon variant="subtle" color="gray" onClick={() => downloadSingleInvoice(inv)} title="Download Invoice PDF">
                      <IconDownload size={18} />
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}

function CompanyForm({ onSuccess }) {
  const form = useForm({
    initialValues: { name: '', address: '' },
    validate: { name: (v) => !v ? 'Required' : null, address: (v) => !v ? 'Required' : null }
  });

  const handleSubmit = async (values) => {
    try {
      await axios.post('/api/companies', values);
      notifications.show({ title: 'Success', message: 'Company Added Successfully', color: 'teal' });
      onSuccess();
      form.reset();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to add company', color: 'red' });
    }
  };

  return (
    <Paper p="xl" radius="md" shadow="sm" withBorder style={{ borderColor: '#E5E7EB', position: 'sticky', top: 20 }}>
      <Title order={4} mb="md" c="indigo.9">Add New Company</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Company Name" placeholder="ABC Corp" withAsterisk {...form.getInputProps('name')} radius="md" />
          <TextInput label="Address" placeholder="Mumbai, India" withAsterisk {...form.getInputProps('address')} radius="md" />
          <Button type="submit" fullWidth mt="md" color="indigo" radius="md">Save Company</Button>
        </Stack>
      </form>
    </Paper>
  );
}

function ProductForm({ onSuccess }) {
  const form = useForm({
    initialValues: { name: '', unit_price: 0, vat_rate: 18, quantity_in_stock: 0 },
    validate: {
      name: (v) => !v ? 'Required' : null,
      unit_price: (v) => v < 0 ? 'Must be positive' : null,
      vat_rate: (v) => v < 0 ? 'Must be positive' : null
    }
  });

  const handleSubmit = async (values) => {
    try {
      await axios.post('/api/products', values);
      notifications.show({ title: 'Success', message: 'Product Added Successfully', color: 'teal' });
      onSuccess();
      form.reset();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to add product', color: 'red' });
    }
  };

  return (
    <Paper p="xl" radius="md" shadow="sm" withBorder style={{ borderColor: '#E5E7EB', position: 'sticky', top: 20 }}>
      <Title order={4} mb="md" c="indigo.9">Add New Product</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Product Name" placeholder="Product A" withAsterisk {...form.getInputProps('name')} radius="md" />
          <Group grow>
            <NumberInput label="Price (₹)" min={0} withAsterisk {...form.getInputProps('unit_price')} radius="md" />
            <NumberInput label="VAT (%)" min={0} withAsterisk {...form.getInputProps('vat_rate')} radius="md" />
          </Group>
          <NumberInput label="Initial Stock" min={0} {...form.getInputProps('quantity_in_stock')} radius="md" />
          <Button type="submit" fullWidth mt="md" color="indigo" radius="md">Save Product</Button>
        </Stack>
      </form>
    </Paper>
  );
}

function OrderForm({ companies, products, onSuccess }) {
  const form = useForm({
    initialValues: { company_id: '', product_id: '', quantity: 1 }
  });

  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleProductChange = (val) => {
    form.setFieldValue('product_id', val);
    const p = products.find(prod => prod.id.toString() === val);
    setSelectedProduct(p);
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const qty = form.values.quantity || 0;
    const total = selectedProduct.unit_price * qty;
    const vat = (total * selectedProduct.vat_rate) / 100;
    return total + vat;
  };

  const handleSubmit = async (values) => {
    try {
      await axios.post('/api/orders', {
        ...values,
        company_id: parseInt(values.company_id),
        product_id: parseInt(values.product_id)
      });
      notifications.show({ title: 'Success', message: 'Invoice Created Successfully', color: 'teal' });
      onSuccess();
      form.reset();
      setSelectedProduct(null);
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to create invoice', color: 'red' });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="lg">
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Text fw={600} mb="xs" c="indigo.9" size="sm" tt="uppercase">Client Details</Text>
          <Select
            label="Select Company"
            placeholder="Search company..."
            data={companies.map(c => ({ value: c.id.toString(), label: c.name }))}
            {...form.getInputProps('company_id')}
            searchable
            nothingFoundMessage="No companies found"
            leftSection={<IconBuildingStore size={16} />}
            radius="md"
            checkIconPosition="right"
            comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
          />
        </Paper>

        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Text fw={600} mb="xs" c="indigo.9" size="sm" tt="uppercase">Order Details</Text>
          <Stack>
            <Select
              label="Select Product"
              placeholder="Search product..."
              data={products.map(p => ({ value: p.id.toString(), label: p.name }))}
              value={form.values.product_id}
              onChange={handleProductChange}
              searchable
              nothingFoundMessage="No products found"
              leftSection={<IconPackage size={16} />}
              radius="md"
              checkIconPosition="right"
              comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
            />
            <NumberInput
              label="Quantity"
              min={1}
              {...form.getInputProps('quantity')}
              radius="md"
            />
          </Stack>
        </Paper>

        {selectedProduct && (
          <Paper withBorder bg="white" radius="md" p="md" shadow="sm" style={{ borderLeft: '4px solid #1ABC9C' }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Unit Price:</Text>
                <Text size="sm" fw={500}>{formatCurrency(Number(selectedProduct.unit_price))}</Text>
              </Group>
              <Group justify="space-between" style={{ borderBottom: '1px dashed #E5E7EB' }} pb="xs">
                <Text size="sm" c="dimmed">VAT Rate:</Text>
                <Text size="sm" fw={500}>{selectedProduct.vat_rate}%</Text>
              </Group>
              <Group justify="space-between" pt="xs">
                <Text fw={700} size="lg" c="indigo.9">Total Payable:</Text>
                <Text fw={700} c="teal.6" size="xl">{formatCurrency(calculateTotal())}</Text>
              </Group>
            </Stack>
          </Paper>
        )}

        <Button type="submit" disabled={!form.isValid() || !form.values.company_id || !form.values.product_id} mt="xs" fullWidth leftSection={<IconReceipt2 size={18} />} color="indigo" size="md" radius="md">
          Generate Invoice And Save
        </Button>
      </Stack>
    </form>
  );
}
